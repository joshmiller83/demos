class MockMutationObserver {
  constructor(private callback: MutationCallback) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  observe(target: Node, options?: MutationObserverInit): void {
    // Mock observe logic or leave empty if not needed for tests
  }

  disconnect(): void {
    // Mock disconnect logic or leave empty if not needed for tests
  }

  takeRecords(): MutationRecord[] {
    // Return whatever is necessary for your tests, likely just an empty array
    return [];
  }
}

// Replace MutationObserver with the mock
global.MutationObserver = MockMutationObserver as typeof MutationObserver;
