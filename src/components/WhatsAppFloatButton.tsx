const WHATSAPP_NUMBER = "919978467266";
const SUGGESTION_MESSAGE =
  "Hi LiveShare team! I have a suggestion:\n\n";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.004 2.667c-7.36 0-13.333 5.973-13.333 13.333 0 2.347.64 4.533 1.76 6.427L2.667 29.333l7.093-1.867A13.26 13.26 0 0 0 16.004 26.667c7.36 0 13.333-5.973 13.333-13.333S23.364 2.667 16.004 2.667zm0 21.333c-2.08 0-4.027-.56-5.707-1.547l-.4-.24-4.213 1.107 1.12-4.107-.267-.427A9.956 9.956 0 0 1 6.004 16c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.493-7.453c-.293-.147-1.76-.867-2.033-.973-.273-.107-.473-.147-.673.147-.2.293-.773.973-.947 1.173-.173.2-.347.227-.64.08-.293-.147-1.24-.457-2.36-1.453-.873-.78-1.46-1.747-1.633-2.04-.173-.293-.019-.453.128-.6.133-.133.293-.347.44-.52.147-.173.193-.293.293-.493.1-.2.047-.373-.027-.52-.073-.147-.673-1.62-.92-2.213-.24-.58-.487-.5-.673-.507l-.573-.013c-.2 0-.52.073-.793.373s-1.04 1.013-1.04 2.473 1.067 2.867 1.213 3.067c.147.2 2.1 3.2 5.08 4.493.71.307 1.267.49 1.7.627.713.227 1.363.193 1.877.117.573-.087 1.76-.72 2.013-1.413.253-.693.253-1.287.173-1.413-.073-.133-.267-.213-.56-.36z" />
    </svg>
  );
}

export function WhatsAppFloatButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    SUGGESTION_MESSAGE,
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Share your suggestions on WhatsApp"
      title="Share your suggestions on WhatsApp"
      className="whatsapp-float"
    >
      <span className="whatsapp-float__ping" aria-hidden="true" />
      <span className="whatsapp-float__ping whatsapp-float__ping--delayed" aria-hidden="true" />
      <span className="whatsapp-float__btn">
        <WhatsAppIcon className="whatsapp-float__icon" />
      </span>
      <span className="whatsapp-float__tooltip">Suggestions?</span>
    </a>
  );
}
