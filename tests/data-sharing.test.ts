import { describe, it, beforeEach, expect } from "vitest"

describe("Data Sharing Contract", () => {
  let mockStorage: Map<string, any>
  let nextDatasetId: number
  
  beforeEach(() => {
    mockStorage = new Map()
    nextDatasetId = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "share-dataset":
        const [experimentId, title, description, dataHash] = args
        nextDatasetId++
        mockStorage.set(`dataset-${nextDatasetId}`, {
          owner: sender,
          experiment_id: experimentId,
          title,
          description,
          data_hash: dataHash,
          access_list: [sender],
        })
        return { success: true, value: nextDatasetId }
      
      case "grant-access":
        const [datasetId, user] = args
        const dataset = mockStorage.get(`dataset-${datasetId}`)
        if (!dataset) return { success: false, error: 404 }
        if (dataset.owner !== sender) return { success: false, error: 403 }
        dataset.access_list.push(user)
        return { success: true }
      
      case "get-dataset":
        return { success: true, value: mockStorage.get(`dataset-${args[0]}`) }
      
      case "has-access":
        const [accessDatasetId, accessUser] = args
        const accessDataset = mockStorage.get(`dataset-${accessDatasetId}`)
        if (!accessDataset) return { success: false, error: 404 }
        return { success: true, value: accessDataset.access_list.includes(accessUser) }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should share a dataset", () => {
    const result = mockContractCall(
        "share-dataset",
        [1, "Tokamak Experiment Results", "Data from recent plasma confinement test", "0x1234567890abcdef"],
        "user1",
    )
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should grant access to a dataset", () => {
    mockContractCall(
        "share-dataset",
        [1, "Tokamak Experiment Results", "Data from recent plasma confinement test", "0x1234567890abcdef"],
        "user1",
    )
    const result = mockContractCall("grant-access", [1, "user2"], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should get dataset information", () => {
    mockContractCall(
        "share-dataset",
        [1, "Tokamak Experiment Results", "Data from recent plasma confinement test", "0x1234567890abcdef"],
        "user1",
    )
    const result = mockContractCall("get-dataset", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      owner: "user1",
      experiment_id: 1,
      title: "Tokamak Experiment Results",
      description: "Data from recent plasma confinement test",
      data_hash: "0x1234567890abcdef",
      access_list: ["user1"],
    })
  })
  
  it("should check if a user has access to a dataset", () => {
    mockContractCall(
        "share-dataset",
        [1, "Tokamak Experiment Results", "Data from recent plasma confinement test", "0x1234567890abcdef"],
        "user1",
    )
    mockContractCall("grant-access", [1, "user2"], "user1")
    const result = mockContractCall("has-access", [1, "user2"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
  })
})

