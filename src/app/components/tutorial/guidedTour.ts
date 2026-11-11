/** True while the guided tour is on screen; its layer carries the `data-guided-tour` attribute. */
export function isGuidedTourOpen(doc: Document = document) {
  return doc.querySelector("[data-guided-tour]") !== null;
}
