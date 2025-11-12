// Universal function to format log messages
const formatLog = (level, moduleName, args) => {
    const timestamp = new Date().toISOString();
    // Returns an argument array for console.* methods
    return [`[${timestamp}] [${level.toUpperCase()}] [${moduleName}]`, ...args];
};

export const createLogger = (moduleName) => ({
    // Methods simply delegate to console.* with formatted arguments
    error: (...args) => console.error(...formatLog('ERROR', moduleName, args)),
    warn: (...args) => console.warn(...formatLog('WARN', moduleName, args)),
    info: (...args) => console.info(...formatLog('INFO', moduleName, args)),
    debug: (...args) => console.log(...formatLog('DEBUG', moduleName, args)),
});

// Default global logger
// Used in routes or when no specific module context is needed.
export const logger = createLogger('APP');
