"use client";

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface AppPaginationProps {
    total: number;
    currentPage: number;
    limit: number;
    onPageChange: (page: number) => void;
}

export default function AppPagination({
    total,
    currentPage,
    limit,
    onPageChange,
}: AppPaginationProps) {
    const totalPages = Math.ceil(total / limit);

    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, currentPage + 2);

        // Adjust for near-start or near-end positions
        if (currentPage <= 3) {
            end = Math.min(totalPages, maxVisible);
        } else if (currentPage >= totalPages - 2) {
            start = Math.max(1, totalPages - (maxVisible - 1));
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <Pagination className="mt-4">
            <PaginationContent>
                {/* Previous */}
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) onPageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                </PaginationItem>

                {/* Ellipsis before */}
                {currentPage > 3 && (
                    <>
                        <PaginationItem>
                            <PaginationLink href="#" className="" onClick={(e) => { e.preventDefault(); onPageChange(1); }}>
                                1
                            </PaginationLink>
                        </PaginationItem>
                        {currentPage > 4 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}
                    </>
                )}

                {/* Page Numbers */}
                {pages.map((page) => (
                    <PaginationItem key={page}>
                        <PaginationLink
                            className=""
                            href="#"
                            isActive={page === currentPage}
                            onClick={(e) => {
                                e.preventDefault();
                                onPageChange(page);
                            }}
                        >
                            {page}
                        </PaginationLink>
                    </PaginationItem>
                ))}

                {/* Ellipsis after */}
                {currentPage < totalPages - 2 && (
                    <>
                        {currentPage < totalPages - 3 && (
                            <PaginationItem>
                                <PaginationEllipsis />
                            </PaginationItem>
                        )}
                        <PaginationItem>
                            <PaginationLink
                                href="#"
                                onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }}
                            >
                                {totalPages}
                            </PaginationLink>
                        </PaginationItem>
                    </>
                )}

                {/* Next */}
                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) onPageChange(currentPage + 1);
                        }}
                        className={
                            currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                        }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
