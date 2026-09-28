export default function DecorativeDivider() {
  return (
    <div className="flex items-center justify-center space-x-3 w-full max-w-xs mx-auto my-3 opacity-90">
      {/* Left ornamental line with gradient fade */}
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#C58A3A] to-[#B87932]" />
      
      {/* Center lotus / floral diamond ornament */}
      <div className="flex items-center space-x-1.5 text-[#B87932]">
        <svg
          className="w-3.5 h-3.5 fill-[#B87932]"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stylized Lotus Diamond Emblem */}
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
        </svg>
      </div>

      {/* Right ornamental line with gradient fade */}
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#C58A3A] to-[#B87932]" />
    </div>
  );
}
