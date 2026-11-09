import { ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children directly into document.body, escaping any CSS transform /
 * overflow-hidden stacking contexts that would otherwise break position:fixed
 * modals (common in Figma preview iframes and scaled containers).
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
