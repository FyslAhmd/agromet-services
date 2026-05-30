import { CiCloudRainbow } from "react-icons/ci";

const ClimateProjection = () => {
  return (
    <div className="min-h-[75vh] rounded-3xl border border-teal-100 bg-linear-to-br from-white via-teal-50/60 to-emerald-50 p-6 sm:p-8 shadow-sm overflow-hidden relative">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-200/25 blur-3xl" />
      <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/80 shadow-lg shadow-teal-900/10 ring-1 ring-teal-100">
          <CiCloudRainbow className="h-16 w-16 text-[#0d5555]" />
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-teal-700/70">
          Climate Projection
        </p>
        <h1 className="max-w-2xl text-3xl font-black tracking-tight text-[#083535] sm:text-5xl">
          Future climate insights are coming soon
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
          This section is being prepared for long-range climate projection tools,
          scenario analysis, and decision-support visualizations for agricultural planning.
          Please continue using Weather Forecast, Forecast Summary, and Weather Alert
          while this feature is under development.
        </p>

        <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {["Scenario analysis", "Crop planning support", "Regional projections"].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/80 bg-white/70 px-4 py-4 text-sm font-semibold text-[#0d4a4a] shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClimateProjection;
