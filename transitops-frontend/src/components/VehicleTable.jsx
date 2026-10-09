import DataTable from "./DataTable";

function VehicleTable({
  vehicles,
  onEdit,
  onDelete,
}) {

  const columns = [
    {
      Header: "Registration",
      accessor: "registrationNumber",
    },
    {
      Header: "Vehicle",
      accessor: "vehicleName",
    },
    {
      Header: "Type",
      accessor: "type",
    },
    {
      Header: "Capacity",
      accessor: "maximumLoadCapacity",
    },
    {
      Header: "Status",
      accessor: "status",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={vehicles}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

export default VehicleTable;