import Image from "next/image" // Import the Image component

export function DashboardPreview() {
  return (
    <div className="w-full md:w-[1160px]">
      <div className="rounded-2xl p-[1px] shadow-2xl" style={{ background: "linear-gradient(145deg, hsl(239 84% 67% / 0.35) 0%, hsl(240 17% 10% / 0.6) 40%, hsl(195 100% 70% / 0.15) 100%)" }}>
        <div className="rounded-2xl bg-[#0d0d14] p-1.5">
          <Image
            src="/images/dashboard-preview.png"
            alt="Dashboard preview"
            width={1160}
            height={700}
            className="w-full h-full object-cover rounded-xl shadow-lg"
          />
        </div>
      </div>
    </div>
  )
}
