import { describe, it, beforeEach, expect } from "vitest"

describe("Experiment Design Contract", () => {
  let mockStorage: Map<string, any>
  let nextExperimentId: number
  
  beforeEach(() => {
    mockStorage = new Map()
    nextExperimentId = 0
  })
  
  const mockContractCall = (method: string, args: any[], sender: string) => {
    switch (method) {
      case "create-experiment":
        const [title, description, parameters] = args
        nextExperimentId++
        mockStorage.set(`experiment-${nextExperimentId}`, {
          lead_researcher: sender,
          title,
          description,
          parameters,
          collaborators: [sender],
          status: "proposed",
        })
        return { success: true, value: nextExperimentId }
      
      case "add-collaborator":
        const [experimentId, collaborator] = args
        const experiment = mockStorage.get(`experiment-${experimentId}`)
        if (!experiment) return { success: false, error: 404 }
        if (experiment.lead_researcher !== sender) return { success: false, error: 403 }
        experiment.collaborators.push(collaborator)
        return { success: true }
      
      case "update-experiment-status":
        const [updateExperimentId, newStatus] = args
        const updateExperiment = mockStorage.get(`experiment-${updateExperimentId}`)
        if (!updateExperiment) return { success: false, error: 404 }
        if (updateExperiment.lead_researcher !== sender) return { success: false, error: 403 }
        updateExperiment.status = newStatus
        return { success: true }
      
      case "get-experiment":
        return { success: true, value: mockStorage.get(`experiment-${args[0]}`) }
      
      case "get-experiments-by-status":
        const experimentsWithStatus = Array.from(mockStorage.entries())
            .filter(([_, value]) => value.status === args[0])
            .map(([key, value]) => ({ [key.split("-")[1]]: value }))
        return { success: true, value: experimentsWithStatus }
      
      default:
        return { success: false, error: "Unknown method" }
    }
  }
  
  it("should create an experiment", () => {
    const result = mockContractCall(
        "create-experiment",
        ["Tokamak Optimization", "Improving plasma confinement", ["temperature", "magnetic field"]],
        "user1",
    )
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
  })
  
  it("should add a collaborator", () => {
    mockContractCall(
        "create-experiment",
        ["Tokamak Optimization", "Improving plasma confinement", ["temperature", "magnetic field"]],
        "user1",
    )
    const result = mockContractCall("add-collaborator", [1, "user2"], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should update experiment status", () => {
    mockContractCall(
        "create-experiment",
        ["Tokamak Optimization", "Improving plasma confinement", ["temperature", "magnetic field"]],
        "user1",
    )
    const result = mockContractCall("update-experiment-status", [1, "in-progress"], "user1")
    expect(result.success).toBe(true)
  })
  
  it("should get experiment information", () => {
    mockContractCall(
        "create-experiment",
        ["Tokamak Optimization", "Improving plasma confinement", ["temperature", "magnetic field"]],
        "user1",
    )
    const result = mockContractCall("get-experiment", [1], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toEqual({
      lead_researcher: "user1",
      title: "Tokamak Optimization",
      description: "Improving plasma confinement",
      parameters: ["temperature", "magnetic field"],
      collaborators: ["user1"],
      status: "proposed",
    })
  })
  
  it("should get experiments by status", () => {
    mockContractCall(
        "create-experiment",
        ["Tokamak Optimization", "Improving plasma confinement", ["temperature", "magnetic field"]],
        "user1",
    )
    mockContractCall(
        "create-experiment",
        ["Stellarator Design", "Enhancing magnetic field configuration", ["coil shape", "plasma pressure"]],
        "user2",
    )
    mockContractCall("update-experiment-status", [2, "in-progress"], "user2")
    const result = mockContractCall("get-experiments-by-status", ["proposed"], "anyone")
    expect(result.success).toBe(true)
    expect(result.value).toHaveLength(1)
    expect(result.value[0]).toHaveProperty("1")
  })
})

