function AddVehicleButton({
  onClick,
}) {

  return (

    <button
      className="primary-btn"
      type="button"
      onClick={onClick}
    >
      + Add Vehicle
    </button>

  );

}

export default AddVehicleButton;