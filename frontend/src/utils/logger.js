// Simple logging utility for frontend
class Logger {
  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };
    return logEntry;
  }

  log(level, message, data = null) {
    const logEntry = this.formatMessage(level, message, data);
    
    // Always log to console in development
    if (this.isDevelopment) {
      console[level === 'error' ? 'error' : 'log'](logEntry);
    }
    
    // In production, you might want to send logs to a service
    // For now, we'll just use console
    if (!this.isDevelopment) {
      console[level === 'error' ? 'error' : 'log'](logEntry);
    }
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  debug(message, data = null) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }
}

// Create a singleton instance
const logger = new Logger();

export default logger;
