interface IconProps {
  size?: number
}

export function InstagramIcon({ size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.3" fill="currentColor" />
    </svg>
  )
}

export function FacebookIcon({ size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.19 2.24.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  )
}

export function WhatsAppIcon({ size = 22 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.48-.89-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.62.71.23 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35ZM12.04 21.5h-.01a9.4 9.4 0 0 1-4.78-1.31l-.35-.21-3.55.93.95-3.46-.23-.36a9.37 9.37 0 0 1-1.44-5.01c0-5.19 4.23-9.42 9.42-9.42 2.52 0 4.88.98 6.66 2.76a9.36 9.36 0 0 1 2.76 6.66c0 5.19-4.23 9.42-9.43 9.42Zm8.02-17.44A11.35 11.35 0 0 0 12.04.76C5.77.76.66 5.86.66 12.14c0 2 .52 3.96 1.52 5.68L.56 23.44l5.77-1.51a11.35 11.35 0 0 0 5.71 1.45h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.37-8.04Z" />
    </svg>
  )
}