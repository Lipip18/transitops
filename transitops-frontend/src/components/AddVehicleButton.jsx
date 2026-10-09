function AddVehicleButton({
  onClick,
}) {

  return (

    <button
      className="primary-btn"
      onClick={onClick}
    >
      + Add Vehicle
    </button>

  );

}

export default AddVehicleButton;