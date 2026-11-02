// These original answer tables use bare currency/percentage markers.
// Scope the repair to reviewed learner tasks; worked examples stay unchanged.
const authoredCurrencyTables:Readonly<Record<string,readonly string[]>>={
  "g12-t1-l06-006": [
    "5de28c26c8ad7c2445a45c5a-1",
    "5de28c26c8ad7c2445a45c5a-2"
  ],
  "g12-t1-l08-008": [
    "e389d06cfb7fb64f840b2b0a-1"
  ],
  "g12-t1-l10-010": [
    "c09a30969bc9333c449b2de8-1"
  ],
  "g12-t1-l12-012": [
    "8988d66223851b62aaef9b0f-1"
  ],
  "g12-t1-l13-013": [
    "214e539720812face95386d7-1"
  ],
  "g12-t1-l15-015": [
    "e0faa6ddcb7f4e6040cc3293-1"
  ],
  "g12-t2-l28-028": [
    "c88e619714dc17dcdef4a522-1"
  ],
  "g12-t3-l44-044": [
    "fb00dc7a43a0b2e6d71588a5-1"
  ],
  "g12-t3-l46-046": [
    "b90a87d3ba18a92875213ae8-1",
    "8a86e495473cd2d6851d42d0-1",
    "431fca3a9b9a258533be674f-1"
  ]
};

export function hasAuthoredCurrencyInputs(unitId:string,blockId?:string){
 return blockId?(authoredCurrencyTables[unitId]?.includes(blockId)??false):false;
}
