// Classes' names are <module>.<class name> after patching
export const patch = (ns: any, path?: string) => {  // eslint-disable-line @typescript-eslint/no-explicit-any
    Object.keys(ns).forEach((key) => {
        const value = ns[key];
        const currentPath = path ? `${path}.${key}` : key;
        if (typeof value === 'object') {
            patch(value, currentPath);
        }
        if (typeof value === 'function') {
            Object.defineProperty(value, 'name', {
                value: currentPath,
                configurable: true,
            });
        }
    })
}