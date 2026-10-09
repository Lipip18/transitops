import {
    useMemo,
    useState,
} from "react";

function usePagination(
  data = [],
  rowsPerPage = 10
) {
  const [page, setPage] =
    useState(1);

  const totalPages = Math.ceil(
    data.length / rowsPerPage
  );

  const paginatedData =
    useMemo(() => {

      const start =
        (page - 1) * rowsPerPage;

      return data.slice(
        start,
        start + rowsPerPage
      );

    }, [
      page,
      data,
      rowsPerPage,
    ]);

  const nextPage = () => {

    if (page < totalPages)
      setPage(page + 1);

  };

  const previousPage = () => {

    if (page > 1)
      setPage(page - 1);

  };

  return {

    page,

    setPage,

    totalPages,

    paginatedData,

    nextPage,

    previousPage,

  };
}

export default usePagination;