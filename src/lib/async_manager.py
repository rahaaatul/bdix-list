"""Modern async operations manager"""

import asyncio
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any, TypeVar

from .logging import async_logger as logger
from .logging import logger as cbdix_logger

T = TypeVar("T")


class AsyncManager:
    """Centralized async operations manager with modern patterns"""

    @staticmethod
    async def gather_with_timeout(
        awaits: list[Awaitable[T]],
        timeout: float | None = None,
        return_exceptions: bool = True,
    ) -> list[T | BaseException]:
        """
        Run awaitables concurrently with timeout handling.

        Args:
            awaits: List of awaitable objects
            timeout: Maximum time to wait (None for no timeout)
            return_exceptions: Whether to include exceptions in results

        Returns:
            List of results or exceptions
        """
        if not awaits:
            return []

        logger.info(f"Executing concurrent operations for {len(awaits)} awaitables")
        logger.debug(
            f"gather_with_timeout: Starting concurrent execution of {len(awaits)} awaitables with timeout={timeout}s"
        )
        try:
            if timeout:
                logger.debug(
                    f"gather_with_timeout: Using wait_for with timeout {timeout}s"
                )
                result = await asyncio.wait_for(
                    asyncio.gather(*awaits, return_exceptions=return_exceptions),  # type: ignore[arg-type]
                    timeout=timeout,
                )
                cbdix_logger.success(
                    logger,
                    f"Concurrent execution with timeout completed, returned {len(result)} results",
                )
                return list(result)
            else:
                logger.debug(
                    "gather_with_timeout: No timeout specified, using gather directly"
                )
                result = await asyncio.gather(
                    *awaits, return_exceptions=return_exceptions
                )
                cbdix_logger.success(
                    logger,
                    f"Concurrent execution without timeout completed, returned {len(result)} results",
                )
                return list(result)

        except TimeoutError:
            logger.error(f"Concurrent execution timed out after {timeout}s")
            logger.debug(
                f"gather_with_timeout: Attempting to cancel {len(awaits)} remaining tasks"
            )
            # Cancel remaining tasks
            for awaitable in awaits:
                if hasattr(awaitable, "cancel"):
                    awaitable.cancel()
            raise

    @staticmethod
    async def stream_results(
        awaits: list[Awaitable[T]], timeout: float | None = None
    ) -> AsyncIterator[tuple[int, T | Exception]]:
        """
        Stream results as they complete using asyncio.as_completed().

        Args:
            awaits: List of awaitable objects
            timeout: Maximum time per operation

        Yields:
            Tuple of (index, result_or_exception)
        """
        logger.info(f"Streaming results for {len(awaits)} awaitables")
        logger.debug(
            f"stream_results: Starting to stream {len(awaits)} awaitables with timeout={timeout}s"
        )

        if not awaits:
            logger.debug("stream_results: No awaitables provided, returning early")
            return

        # Create tasks with timeout wrapping
        async def create_timeout_task(
            awaitable: Awaitable[T], idx: int
        ) -> tuple[int, T | Exception]:
            logger.debug(f"stream_results: Processing awaitable at index {idx}")
            try:
                if timeout:
                    result = await asyncio.wait_for(awaitable, timeout=timeout)
                else:
                    result = await awaitable
                logger.debug(
                    f"stream_results: Successfully completed awaitable at index {idx}"
                )
                return idx, result
            except Exception as e:
                logger.error(f"Exception in awaitable at index {idx}: {e}")
                return idx, e

        # Create tasks
        logger.debug("stream_results: Creating asyncio tasks for concurrent execution")
        tasks = [
            asyncio.create_task(create_timeout_task(awaitable, idx))
            for idx, awaitable in enumerate(awaits)
        ]
        logger.debug(f"stream_results: Created {len(tasks)} tasks")

        try:
            logger.debug(
                "stream_results: Starting to process completed tasks as they finish"
            )
            # Process results as they complete
            for completed_task in asyncio.as_completed(tasks):
                try:
                    result = await completed_task
                    logger.debug(
                        f"stream_results: Yielding result for index {result[0]}"
                    )
                    yield result
                except Exception as e:
                    logger.error(f"Error processing completed task: {e}")
        finally:
            # Clean up any remaining tasks
            logger.debug("stream_results: Starting cleanup of remaining tasks")
            for task in tasks:
                if not task.done():
                    logger.debug("stream_results: Cancelling unfinished task")
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        logger.debug("stream_results: Task cancelled successfully")
                        pass
                    except Exception as e:
                        logger.debug(f"stream_results: Ignoring cleanup error: {e}")
                        pass  # Ignore cleanup errors
            logger.debug("stream_results: Cleanup complete")
            cbdix_logger.success(logger, "All awaitables streamed and processed")

    @staticmethod
    async def shield_operation(awaitable: Awaitable[T]) -> T:
        """
        Shield an operation from cancellation.

        Args:
            awaitable: The operation to protect

        Returns:
            Result of the operation

        Raises:
            Exception: Original exception if operation fails
            CancelledError: If operation was cancelled despite shielding
        """
        logger.info("Shielding operation from cancellation")
        logger.debug("shield_operation: Starting shielded operation")
        try:
            result = await asyncio.shield(awaitable)
            logger.debug("shield_operation: Shielded operation completed successfully")
            cbdix_logger.success(
                logger, "Operation successfully shielded from cancellation"
            )
            return result
        except asyncio.CancelledError:
            logger.debug(
                "shield_operation: Shielded operation was cancelled despite shielding"
            )
            # Re-raise to indicate cancellation while operation continues
            raise
        except Exception as e:
            logger.error(f"Shielded operation failed: {e}")
            raise

    @staticmethod
    async def timeout_context(
        coro: Callable[..., Awaitable[T]], timeout_seconds: float, *args, **kwargs
    ) -> T:
        """
        Execute coroutine with structured timeout context.

        Args:
            coro: Coroutine function to execute
            timeout_seconds: Timeout duration
            *args, **kwargs: Arguments for the coroutine

        Returns:
            Result of the coroutine

        Raises:
            TimeoutError: If operation times out
        """
        logger.info(f"Executing coroutine with {timeout_seconds}s timeout")
        logger.debug(
            f"timeout_context: Starting operation with timeout {timeout_seconds}s"
        )
        try:
            async with asyncio.timeout(timeout_seconds):
                result = await coro(*args, **kwargs)
                logger.debug(
                    "timeout_context: Operation completed successfully within timeout"
                )
                cbdix_logger.success(
                    logger, "Coroutine executed successfully within timeout"
                )
                return result
        except TimeoutError:
            logger.error(f"Coroutine execution timed out after {timeout_seconds}s")
            raise

    @staticmethod
    async def batch_process(
        items: list[Any],
        processor: Callable[[Any], Awaitable[T]],
        batch_size: int = 10,
        timeout_per_item: float = 5.0,
    ) -> list[T | BaseException]:
        """
        Process items in batches with concurrent execution.

        Args:
            items: List of items to process
            processor: Async function to process each item
            batch_size: Number of items to process concurrently
            timeout_per_item: Timeout per individual operation

        Returns:
            List of results
        """
        logger.info(f"Batch processing {len(items)} items with batch size {batch_size}")
        logger.debug(
            f"batch_process: Starting batch processing of {len(items)} items with batch_size={batch_size}"
        )
        results = []
        total_batches = (len(items) + batch_size - 1) // batch_size
        logger.debug(f"batch_process: Will process {total_batches} batches")

        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(items))
            batch = items[start_idx:end_idx]

            logger.debug(
                f"batch_process: Processing batch {batch_num + 1}/{total_batches} with {len(batch)} items"
            )

            # Create awaitables for this batch
            batch_awaits = [
                AsyncManager.timeout_context(processor, timeout_per_item, item)
                for item in batch
            ]

            # Process batch concurrently
            batch_results = await AsyncManager.gather_with_timeout(
                batch_awaits,  # type: ignore[arg-type]
                timeout=timeout_per_item * len(batch) + 5.0,
            )

            results.extend(batch_results)
            logger.debug(
                f"batch_process: Completed batch {batch_num + 1}/{total_batches}, total results so far: {len(results)}"
            )

            # Small delay between batches to be respectful
            if end_idx < len(items):
                logger.debug("batch_process: Adding delay between batches")
                await asyncio.sleep(0.1)

        logger.debug(
            f"batch_process: Completed all batches, total results: {len(results)}"
        )
        cbdix_logger.success(
            logger, f"Batch processing completed, processed {len(results)} items"
        )
        return results

    @staticmethod
    async def retry_operation(
        operation: Callable[..., Awaitable[T]],
        max_retries: int = 3,
        delay: float = 1.0,
        backoff_factor: float = 2.0,
        *args,
        **kwargs,
    ) -> T:
        """
        Retry an operation with exponential backoff.

        Args:
            operation: Async function to retry
            max_retries: Maximum number of retry attempts
            delay: Initial delay between retries
            backoff_factor: Multiplication factor for delays
            *args, **kwargs: Arguments for the operation

        Returns:
            Result of the successful operation

        Raises:
            Exception: If all retries are exhausted
        """
        logger.info(
            f"Retrying operation up to {max_retries + 1} times with exponential backoff"
        )
        logger.debug(
            f"retry_operation: Starting operation with max_retries={max_retries}, delay={delay}s, backoff_factor={backoff_factor}"
        )
        last_exception: Exception | None = None

        for attempt in range(max_retries + 1):
            logger.debug(f"retry_operation: Attempt {attempt + 1}/{max_retries + 1}")
            try:
                result = await operation(*args, **kwargs)
                logger.debug(
                    f"retry_operation: Operation succeeded on attempt {attempt + 1}"
                )
                cbdix_logger.success(
                    logger, f"Operation succeeded on attempt {attempt + 1}"
                )
                return result
            except Exception as e:
                last_exception = e
                logger.debug(f"retry_operation: Attempt {attempt + 1} failed: {e}")

                if attempt == max_retries:
                    logger.error(f"Operation failed after {max_retries} retries: {e}")
                    raise

                wait_time = delay * (backoff_factor**attempt)
                logger.warning(
                    f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s..."
                )
                logger.debug(f"retry_operation: Sleeping for {wait_time}s before retry")
                await asyncio.sleep(wait_time)

        # This should never be reached, but just in case
        if last_exception:
            raise last_exception
        else:
            raise RuntimeError("Unexpected error in retry_operation")


# Utility functions for common async patterns
async def safe_gather(*awaits, timeout=None, return_exceptions=True):
    """Safe wrapper for asyncio.gather with proper error handling"""
    logger.info(f"Safely gathering {len(awaits)} awaitables")
    logger.debug(
        f"safe_gather: Called with {len(awaits)} awaitables, timeout={timeout}"
    )
    result = await AsyncManager.gather_with_timeout(
        list(awaits), timeout, return_exceptions
    )
    logger.debug(f"safe_gather: Completed, returning {len(result)} results")
    cbdix_logger.success(logger, f"Safe gather completed with {len(result)} results")
    return result


async def process_with_progress[T](
    awaits: list[Awaitable[T]],
    progress_callback: Callable[[int, int], None] | None = None,
) -> list[T | Exception]:
    """
    Process awaitables with optional progress callback.

    Args:
        awaits: List of awaitable objects
        progress_callback: Optional callback(total_completed, total_items)

    Returns:
        List of results
    """
    logger.info(f"Processing {len(awaits)} awaitables with progress tracking")
    logger.debug(
        f"process_with_progress: Starting to process {len(awaits)} awaitables with progress_callback={'enabled' if progress_callback else 'disabled'}"
    )
    results = []
    total = len(awaits)
    completed = 0

    async for _idx, result in AsyncManager.stream_results(awaits):
        results.append(result)
        completed += 1
        logger.debug(f"process_with_progress: Completed {completed}/{total} awaitables")

        if progress_callback:
            progress_callback(completed, total)

    logger.debug(f"process_with_progress: Completed all {len(results)} awaitables")
    cbdix_logger.success(
        logger, f"Progress processing completed for {len(results)} awaitables"
    )
    return results
