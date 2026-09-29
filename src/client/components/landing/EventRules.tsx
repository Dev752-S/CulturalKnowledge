export default function EventRules() {
  return (
    <div className="w-full text-center mt-6 sm:mt-8 select-none flex flex-col items-center">
      {/* Rules Section Title */}
      <h3 className="font-cormorant text-2xl sm:text-3xl md:text-[34px] font-semibold text-[#54133F] tracking-wide leading-tight">
        Event Rules &amp; Instructions
      </h3>

      {/* Thin, elegant, warm brown/gold decorative divider */}
      <div className="w-48 sm:w-64 h-[1.5px] bg-gradient-to-r from-transparent via-[#C58A3A]/70 to-transparent mx-auto my-2.5 sm:my-3.5" />

      {/* Rules List - Left aligned within centered content block */}
      <div className="inline-block text-left max-w-[480px] px-4">
        <ul className="font-cormorant text-base sm:text-lg md:text-[19px] text-[#3E231C] space-y-1.5 sm:space-y-2 font-normal leading-relaxed">
          <li className="flex items-start">
            <span className="mr-2 text-[#54133F] font-bold">•</span>
            <span>Mobile phones used by team members only.</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2 text-[#54133F] font-bold">•</span>
            <span>Maximum of four members per team.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
