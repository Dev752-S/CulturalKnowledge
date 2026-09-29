export default function EventRules() {
  return (
    <div className="w-full text-center mt-6 sm:mt-8 select-none flex flex-col items-center">
      {/* Rules Section Title */}
      <h3 className="font-cormorant text-2xl sm:text-3xl md:text-[34px] font-semibold text-[#54133F] tracking-wide leading-tight">
        Event Rules &amp; Instructions
      </h3>

      {/* Thin, elegant, warm brown/gold decorative divider */}
      <div className="w-48 sm:w-64 h-[1.5px] bg-gradient-to-r from-transparent via-[#C58A3A]/70 to-transparent mx-auto my-2.5 sm:my-3.5" />

      {/* Rules and Instructions Content */}
      <div className="inline-block text-left max-w-2xl px-4 w-full space-y-4">
        {/* Instructions */}
        <div>
          <h4 className="font-cormorant text-base sm:text-lg font-bold text-[#54133F] tracking-wider uppercase mb-1">
            Instructions
          </h4>
          <ul className="font-cormorant text-sm sm:text-base md:text-[17px] text-[#3E231C] space-y-1.5 font-normal leading-relaxed">
            <li className="flex items-start">
              <span className="mr-2 text-[#54133F] font-bold">•</span>
              <span>
                Each team can have a maximum of <strong>2 members</strong>.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#54133F] font-bold">•</span>
              <span>
                The two members of a team must use only <strong>ONE device/resource</strong> for participating (e.g., one laptop for the two members OR one mobile phone for the two members).
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#54133F] font-bold">•</span>
              <span>
                2 members are allowed per team, but the team gets only ONE device/resource for participating (2 members + 1 laptop = allowed, 2 members + 1 mobile = allowed, 2 members + 2 mobiles = NOT allowed, 2 members + laptop + mobile = NOT allowed). The team must NOT use a second mobile, a second laptop, an additional computer, multiple devices, a secondary device for searching or assistance, or multiple screens.
              </span>
            </li>
          </ul>
        </div>

        {/* Competition Rules */}
        <div>
          <h4 className="font-cormorant text-base sm:text-lg font-bold text-[#54133F] tracking-wider uppercase mb-1">
            Competition Rules
          </h4>
          <ul className="font-cormorant text-sm sm:text-base md:text-[17px] text-[#3E231C] space-y-1.5 font-normal leading-relaxed">
            <li className="flex items-start">
              <span className="mr-2 text-[#54133F] font-bold">•</span>
              <span>
                <strong>Rule 1 — No Other Tabs:</strong> Participants must not open or use other browser tabs/windows during the competition.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#54133F] font-bold">•</span>
              <span>
                <strong>Rule 2 — No AI Assistance:</strong> Participants must not use AI tools or AI assistants to obtain answers during the competition. This includes external AI tools/services.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#54133F] font-bold">•</span>
              <span>
                <strong>Rule 3 — No Communication With Others:</strong> Participants must not communicate with other participants or receive outside assistance while attempting the competition.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#54133F] font-bold">•</span>
              <span>
                <strong>Rule 4 — No Multi-Screen / Additional Device:</strong> Participants must not use multiple screens or additional devices to obtain assistance or access the competition.
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 text-[#B3392F] font-bold">•</span>
              <span>
                <strong>Rule 5 — Violation Consequence:</strong> Violation of the competition rules may result in immediate elimination/disqualification from the competition.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
