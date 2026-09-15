export default function SceneFallback() {
  return (
    <div className="scene-fallback" data-testid="scene-fallback" aria-hidden="true">
      <svg viewBox="0 0 900 800" preserveAspectRatio="xMidYMid slice" focusable="false">
        <rect width="900" height="800" fill="#eee9da" />
        <path d="M0 0H700V485L0 640Z" fill="#e5e4d6" />
        <path d="M700 0H900V650L700 485Z" fill="#d6d8c8" />
        <path d="M0 640L700 485L900 650V800H0Z" fill="#c7a780" />
        <path d="M0 721L755 527M125 800L808 571M370 800L856 613M630 800L900 655" stroke="#b99972" strokeWidth="3" />
        <rect x="255" y="94" width="342" height="324" fill="#b3c4bd" stroke="#f7f3e7" strokeWidth="19" />
        <path d="M265 330Q345 165 455 323Q545 183 587 293V408H265Z" fill="#91a48b" />
        <path d="M265 365Q405 230 587 360V408H265Z" fill="#6d8872" />
        <path d="M426 102V416M263 267H590" stroke="#f7f3e7" strokeWidth="10" />
        <path d="M248 426H608" stroke="#c3ab86" strokeWidth="18" />
        <ellipse cx="484" cy="687" rx="250" ry="64" fill="#acb39d" />
        <path d="M323 565L303 698M658 557L684 677" stroke="#8f6c49" strokeWidth="24" />
        <ellipse cx="491" cy="549" rx="207" ry="70" fill="#98724c" />
        <ellipse cx="491" cy="538" rx="207" ry="70" fill="#c19a6b" />
        <path d="M405 522L481 506L526 534L452 551Z" fill="#f8f3e6" />
        <ellipse cx="557" cy="503" rx="23" ry="10" fill="#546b5b" />
        <path d="M534 500V524Q557 548 580 524V500" fill="#6f8873" />
        <path d="M580 508C609 498 609 538 580 527" fill="none" stroke="#6f8873" strokeWidth="8" />
        <path d="M115 616L98 549H175L163 616Z" fill="#bb8164" />
        <path d="M137 551V352M137 440Q54 433 79 379Q148 379 137 440M137 490Q218 469 209 410Q139 427 137 490" fill="#607d61" stroke="#607d61" strokeWidth="8" />
      </svg>
    </div>
  )
}
