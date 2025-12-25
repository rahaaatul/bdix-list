"""Centralized logging system with emoji formatting"""

import logging
import sys


class EmojiFormatter(logging.Formatter):
    """Custom formatter that adds emojis to log messages"""

    EMOJI_MAP = {
        logging.DEBUG: "🟣",
        logging.INFO: "🔵",
        logging.WARNING: "🟡",
        logging.ERROR: "🔴",
        logging.CRITICAL: "🔴",
    }

    SUCCESS_LEVEL = 25  # Custom level for success messages
    EMOJI_MAP[SUCCESS_LEVEL] = "🟢"

    def format(self, record):
        # Add emoji to the beginning of the message
        emoji = self.EMOJI_MAP.get(record.levelno, "🔵")
        record.msg = f"{emoji} {record.msg}"
        return super().format(record)


class CBDIXLogger:
    """Centralized logger for BDIX connectivity tester"""

    _instance: CBDIXLogger | None = None
    _initialized = False

    def __new__(cls) -> CBDIXLogger:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._setup_logging()
            CBDIXLogger._initialized = True

    def _setup_logging(self) -> None:
        """Configure logging with emoji formatting"""

        # Clear any existing handlers
        logging.getLogger().handlers.clear()

        # Create console handler
        console_handler = logging.StreamHandler(sys.stderr)
        console_handler.setLevel(logging.DEBUG)

        # Create emoji formatter
        formatter = EmojiFormatter(fmt="%(message)s")
        console_handler.setFormatter(formatter)

        # Configure root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)  # Default to INFO level
        root_logger.addHandler(console_handler)

        # Set up specific loggers for different modules
        self._setup_module_loggers()

    def _setup_module_loggers(self) -> None:
        """Set up loggers for different modules with appropriate levels"""
        # All modules default to INFO level, can be changed to DEBUG with verbose
        logging.getLogger("cbdix.core").setLevel(logging.INFO)
        logging.getLogger("cbdix.async_manager").setLevel(logging.INFO)
        logging.getLogger("cbdix.cli").setLevel(logging.INFO)
        logging.getLogger("cbdix.utils").setLevel(logging.INFO)

        # External libraries - reduce noise
        logging.getLogger("asyncio").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("icmplib").setLevel(logging.WARNING)

    def get_logger(self, name: str) -> logging.Logger:
        """Get a configured logger for a specific module"""
        return logging.getLogger(name)

    def success(self, logger: logging.Logger, message: str) -> None:
        """Log a success message"""
        logger.log(EmojiFormatter.SUCCESS_LEVEL, message)


# Global logger instance
logger = CBDIXLogger()


def get_logger(name: str) -> logging.Logger:
    """Convenience function to get a configured logger"""
    return logger.get_logger(name)


def setup_logging(verbose: bool = False) -> None:
    """Setup logging configuration with optional verbose mode"""
    # Set log level based on verbose flag
    if verbose:
        # Show DEBUG level and above
        level = logging.DEBUG
    else:
        # Show INFO level and above (hide DEBUG)
        level = logging.INFO

    # Update root logger level
    logging.getLogger().setLevel(level)

    # Update specific loggers
    logging.getLogger("cbdix.core").setLevel(level)
    logging.getLogger("cbdix.async_manager").setLevel(level)
    logging.getLogger("cbdix.cli").setLevel(level)
    logging.getLogger("cbdix.utils").setLevel(level)


# Export commonly used loggers
core_logger = get_logger("cbdix.core")
async_logger = get_logger("cbdix.async_manager")
cli_logger = get_logger("cbdix.cli")
utils_logger = get_logger("cbdix.utils")


# Add success method to logger
def success(message: str) -> None:
    """Log a success message"""
    logger.success(core_logger, message)


def color_highlight(text: str, level: str = "INFO") -> str:
    """
    Highlight text with color and bold based on log level.

    Args:
        text: Text to highlight
        level: Log level ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'SUCCESS')

    Returns:
        ANSI formatted text with color and bold
    """
    # ANSI text color codes (based on original background colors, adapted for text)
    TEXT_COLORS = {
        "DEBUG": "\033[35m",  # Magenta text
        "INFO": "\033[34m",  # Blue text
        "WARNING": "\033[33m",  # Yellow text
        "ERROR": "\033[31m",  # Red text
        "SUCCESS": "\033[32m",  # Green text
    }

    BOLD = "\033[1m"
    RESET = "\033[0m"

    text_color = TEXT_COLORS.get(level.upper(), TEXT_COLORS["INFO"])
    return f"{text_color}{BOLD}{text}{RESET}"
