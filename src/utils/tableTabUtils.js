/**
 * Utility functions for Running Table Tab & Add-on Order Merging
 */

/**
 * Resolves the primary table number for a given table string/number based on active physical table merges.
 * E.g., if Table 2 is merged under Primary Table 1, resolveTableId("2", merges) returns "1".
 */
export const resolvePrimaryTable = (tableNumStr, tableMerges = []) => {
  if (!tableNumStr) return 'General';
  const tableNum = parseInt(tableNumStr, 10);
  if (isNaN(tableNum)) return tableNumStr;

  if (Array.isArray(tableMerges)) {
    for (const merge of tableMerges) {
      if (merge.primary === tableNum || (Array.isArray(merge.children) && merge.children.includes(tableNum))) {
        return String(merge.primary);
      }
    }
  }
  return String(tableNum);
};

/**
 * Groups active orders by primary table ID / tab.
 * Ignores completed, cancelled, and resolved assistance orders.
 * Returns an array of Tab objects:
 * {
 *   primaryTable: string,
 *   orders: Order[],
 *   totalPrice: number,
 *   itemCount: number,
 *   hasAssistanceNeeded: boolean,
 *   statuses: string[],
 *   tablesInTab: string[]
 * }
 */
export const getRunningTabs = (orders = [], tableMerges = []) => {
  if (!Array.isArray(orders)) return [];

  // Filter active orders belonging to tables
  const activeOrders = orders.filter(o => {
    if (!o) return false;
    // Exclude finished / dead states
    if (o.status === 'completed' || o.status === 'cancelled' || o.status === 'assistance_resolved') return false;
    return true;
  });

  const tabsMap = {};

  activeOrders.forEach(order => {
    const rawTable = order.table_number ? String(order.table_number) : 'General';
    const primaryTable = resolvePrimaryTable(rawTable, tableMerges);

    if (!tabsMap[primaryTable]) {
      tabsMap[primaryTable] = {
        primaryTable,
        orders: [],
        totalPrice: 0,
        itemCount: 0,
        hasAssistanceNeeded: false,
        statuses: new Set(),
        tablesInTab: new Set()
      };
    }

    const tab = tabsMap[primaryTable];
    tab.orders.push(order);
    tab.tablesInTab.add(rawTable);
    
    // Parse total price safely
    const orderPrice = typeof order.total_price === 'number' 
      ? order.total_price 
      : parseFloat(order.total_price || 0);

    // Skip assistance-only fake 0-total orders from messing up total price, but note assistance state
    if (order.status === 'assistance_needed') {
      tab.hasAssistanceNeeded = true;
    } else {
      tab.totalPrice += isNaN(orderPrice) ? 0 : orderPrice;
      tab.statuses.add(order.status || 'pending');
    }
  });

  // Convert map to array and compute item counts & merged table lists
  return Object.values(tabsMap).map(tab => {
    // Sort orders by timestamp / id ascending
    tab.orders.sort((a, b) => (a.id || 0) - (b.id || 0));

    // Calculate total items count across food orders
    let totalItems = 0;
    tab.orders.forEach(o => {
      if (o.items && o.status !== 'assistance_needed') {
        const itemMatches = o.items.match(/\d+x/g);
        if (itemMatches) {
          itemMatches.forEach(m => {
            const count = parseInt(m.replace('x', ''), 10);
            totalItems += isNaN(count) ? 1 : count;
          });
        } else {
          totalItems += 1;
        }
      }
    });

    tab.itemCount = totalItems;
    tab.statuses = Array.from(tab.statuses);
    tab.tablesInTab = Array.from(tab.tablesInTab);
    return tab;
  });
};

/**
 * Formats a clean consolidated items summary string for printing unified table receipts.
 */
export const formatTabConsolidatedItems = (tabOrders = []) => {
  const foodOrders = tabOrders.filter(o => o.items && o.status !== 'assistance_needed');
  if (foodOrders.length === 0) return 'No items';

  if (foodOrders.length === 1) {
    return foodOrders[0].items;
  }

  // Multi-order breakdown
  return foodOrders.map((o, idx) => {
    const timeStr = o.created_at ? new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const header = `--- Add-on Order #${idx + 1} ${timeStr ? `(${timeStr})` : ''} ---`;
    return `${header}\n${o.items}`;
  }).join('\n\n');
};

/**
 * Checks if a table has multiple active food orders (Add-ons present).
 */
export const hasAddonOrders = (orders = [], tableNumber, tableMerges = []) => {
  const tabs = getRunningTabs(orders, tableMerges);
  const primary = resolvePrimaryTable(String(tableNumber), tableMerges);
  const tab = tabs.find(t => t.primaryTable === primary);
  if (!tab) return false;
  const foodOrders = tab.orders.filter(o => o.status !== 'assistance_needed');
  return foodOrders.length > 1;
};
