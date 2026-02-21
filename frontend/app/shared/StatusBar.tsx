export function StatusBar() {
    return (
      <div className="flex justify-between items-center py-3 px-6 bg-[#FFFCEE]">
        <div className="text-[15px] font-semibold tracking-[-0.4px]">9:41</div>
        <div className="flex items-center gap-1.5">
          {/* Signal bars */}
          <svg className="w-[17px] h-[11px]" viewBox="0 0 17 11" fill="none">
            <rect x="0" y="7" width="3" height="4" rx="1" fill="black"/>
            <rect x="4.5" y="5" width="3" height="6" rx="1" fill="black"/>
            <rect x="9" y="3" width="3" height="8" rx="1" fill="black"/>
            <rect x="13.5" y="0" width="3" height="11" rx="1" fill="black"/>
          </svg>
          {/* 5G text */}
          <span className="text-[11px] font-semibold">5G</span>
          {/* Battery percentage */}
          <div className="flex items-center gap-0.5">
            <span className="text-[11px] font-semibold">80</span>
            {/* Battery icon */}
            <svg className="w-[25px] h-[11.5px]" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="20" height="11" rx="2" stroke="black" strokeOpacity="0.35"/>
              <rect x="2" y="2" width="17" height="8" rx="1" fill="black"/>
              <path d="M22 4C22 3.44772 22.4477 3 23 3C23.5523 3 24 3.44772 24 4V8C24 8.55228 23.5523 9 23 9C22.4477 9 22 8.55228 22 8V4Z" fill="black" fillOpacity="0.4"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }