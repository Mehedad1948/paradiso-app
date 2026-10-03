"use client";
import { Pagination } from "@heroui/pagination";
export default function PanelPagination({
  page,
  totalPages,
  onChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) return null;
  return (
    <Pagination
      className="mt-6"
      isCompact
      showControls
      color="primary"
      page={page}
      total={totalPages}
      onChange={onChange}
      isDisabled={disabled}
    />
  );
}
