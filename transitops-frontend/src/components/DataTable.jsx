import {
    Eye,
    Pencil,
    Trash2,
} from "lucide-react";

import "../styles/table.css";

function DataTable({
  columns = [],
  data = [],
  actions = {},
}) {
  return (
    <div className="table-container">

      <table className="data-table">

        <thead>

          <tr>

            {columns.map((column) => (
              <th key={column.key || column.accessor}>
                {column.label || column.Header}
              </th>
            ))}

            {(actions.view ||
              actions.edit ||
              actions.delete) && (
              <th>Actions</th>
            )}

          </tr>

        </thead>

        <tbody>

          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row._id}>

                {columns.map((column) => (
                  <td key={column.key || column.accessor}>
                    {column.render
                      ? column.render(row)
                      : row[column.key || column.accessor]}
                  </td>
                ))}

                {(actions.view ||
                  actions.edit ||
                  actions.delete) && (

                  <td>

                    <div className="table-actions">

                      {actions.view && (
                        <button
                          className="view-btn"
                          type="button"
                          aria-label="View record"
                          onClick={() =>
                            actions.view(row)
                          }
                        >
                          <Eye size={18} />
                        </button>
                      )}

                      {actions.edit && (
                        <button
                          className="edit-btn"
                          type="button"
                          aria-label="Edit record"
                          onClick={() =>
                            actions.edit(row)
                          }
                        >
                          <Pencil size={18} />
                        </button>
                      )}

                      {actions.delete && (
                        <button
                          className="delete-btn"
                          type="button"
                          aria-label="Delete record"
                          onClick={() =>
                            actions.delete(row)
                          }
                        >
                          <Trash2 size={18} />
                        </button>
                      )}

                    </div>

                  </td>

                )}

              </tr>
            ))
          ) : (
            <tr>

              <td
                colSpan={
                  columns.length + 1
                }
                className="empty-table"
              >
                No Data Found
              </td>

            </tr>
          )}

        </tbody>

      </table>

    </div>
  );
}

export default DataTable;