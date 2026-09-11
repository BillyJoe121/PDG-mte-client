type RouteLoadingProps = {
  label?: string;
  detail?: string;
  fullScreen?: boolean;
};

export function RouteLoading({
  label = "Cargando módulo",
  detail = "Preparando tu espacio de trabajo",
  fullScreen = false,
}: RouteLoadingProps) {
  return (
    <div
      className={`route-loading flex items-center justify-center px-6 ${
        fullScreen ? "min-h-[100dvh]" : "min-h-[55vh]"
      }`}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className="route-loading__card bg-white px-8 py-7 text-center">
        <div className="route-loading__mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="mt-5 text-sm font-extrabold text-[#222245]">{detail}</p>
        <p className="mt-1 text-xs font-semibold text-[#6B7280]">{label}</p>
      </div>
    </div>
  );
}
