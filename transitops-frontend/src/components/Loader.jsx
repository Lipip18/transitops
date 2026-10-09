function Loader() {
  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      <div
        className="w-12 h-12 rounded-full animate-spin"
        style={{
          border: "3px solid var(--border)",
          borderTopColor: "var(--amber)",
        }}
      />
      <p className="text-sm" style={{ color: "var(--ink-500)" }}>
        Loading TransitOps…
      </p>
    </div>
  );
}

export default Loader;
