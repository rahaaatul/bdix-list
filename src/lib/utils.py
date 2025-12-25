"""Utility functions for BDIX Ping"""

import json
import pathlib
from urllib.parse import urlparse

from .logging import color_highlight, success
from .logging import utils_logger as logger


def load_bdix_urls(data_path: str = "data/bdix-urls.json") -> list[dict]:
    """Load BDIX URLs from JSON file"""

    logger.debug(f"Loading BDIX URLs from {color_highlight(data_path, 'DEBUG')}")
    logger.debug(
        f"Loading BDIX URLs from data_path='{color_highlight(data_path, 'DEBUG')}'"
    )
    logger.debug(
        f"Current file location: {color_highlight(str(pathlib.Path(__file__)), 'DEBUG')}"
    )

    file_path = pathlib.Path(__file__).parent.parent / data_path
    logger.debug(f"Constructed file path: {color_highlight(str(file_path), 'DEBUG')}")

    if not file_path.exists():
        logger.error(f"BDIX URLs file not found: {file_path}")
        raise FileNotFoundError(f"BDIX URLs file not found: {file_path}")

    logger.debug(f"File exists: {file_path.exists()}")
    logger.debug("Opening file for reading")

    try:
        with open(file_path, encoding="utf-8") as f:
            logger.debug("Reading JSON data from file")
            data = json.load(f)
            logger.debug(f"Successfully loaded {len(data)} URL entries from {data_path}"
            )
            return data
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in BDIX URLs file {file_path}: {e}")
        raise
    except Exception as e:
        logger.error(f"Error reading BDIX URLs file {file_path}: {e}")
        raise


def extract_hostname(url: str) -> str:
    """Extract hostname from URL"""
    logger.debug(f"extract_hostname: Processing URL: {url}")
    try:
        logger.debug("extract_hostname: Attempting to parse URL")
        parsed = urlparse(url)
        hostname = parsed.hostname or url
        logger.debug(f"extract_hostname: Extracted hostname: {hostname}")
        return hostname
    except Exception as e:
        logger.error(f"Failed to parse hostname from URL '{url}': {e}")
        logger.debug(f"extract_hostname: URL parsing failed with exception: {e}")
        logger.debug(f"extract_hostname: Returning original URL as fallback: {url}")
        return url


def get_hostnames_from_urls(urls: list[dict]) -> list[str]:
    """Extract hostnames from list of URL dictionaries"""
    logger.info(f"Extracting hostnames from {len(urls)} URLs")
    logger.debug(f"get_hostnames_from_urls: Processing {len(urls)} URL dictionaries")
    logger.debug("get_hostnames_from_urls: Starting hostname extraction for each URL")

    hostnames = [extract_hostname(url["url"]) for url in urls]

    logger.debug(
        f"get_hostnames_from_urls: Successfully extracted {len(hostnames)} hostnames"
    )
    logger.debug(
        f"get_hostnames_from_urls: Sample hostnames: {hostnames[:5] if len(hostnames) > 5 else hostnames}"
    )
    logger.info(f"Successfully extracted {len(hostnames)} hostnames from URLs")
    return hostnames
