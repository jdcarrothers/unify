export async function enrichWithBalances<T>(
  items: T[],
  getBalance: (id: string) => Promise<number | null>,
  getItemId: (item: T) => string
): Promise<Array<T & { balance: number | undefined }>> {
  return Promise.all(
    items.map(async (item) => {
      const balance = await getBalance(getItemId(item));
      return { ...item, balance: balance ?? undefined };
    })
  );
}
export function mergeTransactions<T>(
  existing: T[],
  incoming: T[],
  keyFn: (tx: T) => string,
  dateFn: (tx: T) => string
): T[] {
  const mergedMap = new Map<string, T>();

  for (const tx of existing) {
    mergedMap.set(keyFn(tx), tx);
  }

  for (const tx of incoming) {
    const key = keyFn(tx);
    if (!mergedMap.has(key)) {
      mergedMap.set(key, tx);
    }
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(dateFn(a)).getTime() - new Date(dateFn(b)).getTime()
  );
}

export function sumBalances(
  items: Array<{ balance?: number | string | null }>,
  transform?: (balance: number) => number
): number {
  return items.reduce((sum, item) => {
    const balance = Number(item.balance ?? 0);
    const transformedBalance = transform ? transform(balance) : balance;
    return sum + transformedBalance;
  }, 0);
}

export function sortByDate<T extends { dateTime?: string; timestamp?: string }>(
  list: T[]
): T[] {
  return list.sort((a, b) => {
    const dateA = new Date(a.dateTime || a.timestamp || 0).getTime();
    const dateB = new Date(b.dateTime || b.timestamp || 0).getTime();
    return dateA - dateB;
  });
}

export interface ConnectionConfig {
  id: string;
  title: string;
  icon: string;
  description: string;
  statusPath: string[];
  hasDataPath?: string[];
  buttonLabel: {
    disconnected: string;
    connected: string;
    withData?: string;
  };
}

export function getNestedValue(obj: any, path: string[]): any {
  return path.reduce((current, key) => current?.[key], obj);
}

export function useConnectionStatus(status: any, configs: ConnectionConfig[]) {
  return configs.map((config) => {
    const isConnected = !!getNestedValue(status, config.statusPath);
    const hasData = config.hasDataPath
      ? Array.isArray(getNestedValue(status, config.hasDataPath)) &&
        getNestedValue(status, config.hasDataPath).length > 0
      : true;

    let buttonLabel = isConnected
      ? config.buttonLabel.connected
      : config.buttonLabel.disconnected;
    if (isConnected && config.buttonLabel.withData && hasData) {
      buttonLabel = config.buttonLabel.withData;
    }

    return {
      ...config,
      isConnected,
      hasData,
      buttonLabel,
      status: isConnected
        ? hasData
          ? "ready"
          : "initializing"
        : "disconnected",
    };
  });
}
