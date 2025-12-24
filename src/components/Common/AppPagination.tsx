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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";

interface AppPaginationProps {
  total: number;
  currentPage: number;
  limit: number;
}

export default function AppPagination({
  total,
  currentPage,
  limit,
}: AppPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Ensure page is always a valid number
  const page = Number(currentPage) || 1;
  const totalPages = Math.ceil(total / limit);

  // Don't render if there's only one page
  if (totalPages <= 1) return null;

  // Helper to construct the URL with existing filters preserved
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (e: React.MouseEvent, p: number) => {
    e.preventDefault();
    if (p < 1 || p > totalPages) return;
    router.push(createPageURL(p), { scroll: false });
  };

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);

    if (page <= 3) {
      start = 1;
      end = Math.min(totalPages, maxVisible);
    } else if (page >= totalPages - 2) {
      start = Math.max(1, totalPages - (maxVisible - 1));
      end = totalPages;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <Pagination className="mt-6">
      <PaginationContent className="flex flex-wrap justify-center gap-1 sm:gap-2">
        
        {/* Previous Button */}
        <PaginationItem>
          <PaginationPrevious
            href={createPageURL(page - 1)}
            onClick={(e) => handlePageChange(e, page - 1)}
            className={cn(
              "cursor-pointer",
              page <= 1 && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>

        {/* First Page & Ellipsis (if far from start) */}
        {page > 3 && (
          <>
            <PaginationItem>
              <PaginationLink
                href={createPageURL(1)}
                onClick={(e) => handlePageChange(e, 1)}
                className="cursor-pointer"
              >
                1
              </PaginationLink>
            </PaginationItem>
            {page > 4 && (
              <PaginationItem className="hidden sm:block">
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {/* Dynamic Page Numbers */}
        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              href={createPageURL(p)}
              isActive={page === p} // Core logical fix
              onClick={(e) => handlePageChange(e, p)}
              className={cn(
                "cursor-pointer w-9 h-9 sm:w-8 sm:h-8 ",
                page === p 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-white dark:bg-primary hover:dark:bg-primary/90 hover:dark:text-headingTextColor dark:border-none font-bold border-primary shadow-sm" 
                  : "hover:bg-accent"
              )}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Last Page & Ellipsis (if far from end) */}
        {page < totalPages - 2 && (
          <>
            {page < totalPages - 3 && (
              <PaginationItem className="hidden sm:block">
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                href={createPageURL(totalPages)}
                onClick={(e) => handlePageChange(e, totalPages)}
                className="cursor-pointer"
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        {/* Next Button */}
        <PaginationItem>
          <PaginationNext
            href={createPageURL(page + 1)}
            onClick={(e) => handlePageChange(e, page + 1)}
            className={cn(
              "cursor-pointer",
              page >= totalPages && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>

      </PaginationContent>
    </Pagination>
  );
}