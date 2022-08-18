import { Protocol } from "./types";

export default {
  flextesaUrl: "http://localhost",
  flextesaPort: 20000,
  availableBoxes: ["hangzbox", "granabox", "ithacabox", "jakartabox"],
  defaultBox: "jakartabox",
  defaultProtocol: Protocol.JAKARTA,
  availableImageIds: [20210930, 20220127, 20220510],
  defaultImageId: 20220510,
  accounts: {
    alice: {
      pk: "edpkvGfYw3LyB1UcCahKQk4rF2tvbMUk8GFiTuMjL75uGXrpvKXhjn",
      pkh: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
      sk: "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq"
    },
    bob: {
      pk: "edpkurPsQ8eUApnLUJ9ZPDvu98E8VNj4KtJa1aZr16Cr5ow5VHKnz4",
      pkh: "tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6",
      sk: "edsk3RFfvaFaxbHx8BMtEW1rKQcPtDML3LXjNqMNLCzC3wLC1bWbAt"
    }
  },
  blockTime: 5
};
