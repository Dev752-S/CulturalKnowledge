export default function CulturalHero() {
  return (
    <div className="w-full text-center select-none flex flex-col items-center">
      {/* ‘Welcome to line with exact open single quote */}
      <h2 className="font-cormorant text-2xl sm:text-3xl md:text-[34px] lg:text-[38px] font-normal text-[#54133F] leading-tight tracking-wide">
        ‘Welcome to
      </h2>

      {/* Main Title: Cultural Knowledge */}
      <h1 className="font-cormorant text-4xl sm:text-5xl md:text-[56px] lg:text-[62px] font-semibold text-[#54133F] leading-[1.08] tracking-[0.5px] my-1 sm:my-1.5">
        Cultural Knowledge
      </h1>

      {/* Subtitle: Where Campus Culture Comes Alive */}
      <p className="font-cormorant text-lg sm:text-xl md:text-[23px] font-normal text-[#54133F] mt-0.5 mb-4 sm:mb-5 tracking-wide">
        Where Campus Culture Comes Alive
      </p>

      {/* Preserved Exact Description constrained to ~500px–560px */}
      <p className="font-cormorant text-base sm:text-lg md:text-[18px] leading-relaxed text-[#4A211C] max-w-[540px] px-4 mx-auto font-normal">
        Discover college events, showcase your talent, join competitions, connect with student
        communities, and celebrate the creativity of our campus.
      </p>
    </div>
  );
}
