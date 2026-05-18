export function RouteLoading() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="rounded-lg bg-white px-5 py-4" style={{ border: "1.5px solid #E5E7EB" }}>
        <div className="flex items-center gap-3">
          <div
            className="rounded-full"
            style={{
              width: 12,
              height: 12,
              backgroundColor: "#5454E9",
              boxShadow: "20px 0 0 #E4EB60, 40px 0 0 #4CB979",
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#374151" }}>Cargando modulo...</span>
        </div>
      </div>
    </div>
  );
}

