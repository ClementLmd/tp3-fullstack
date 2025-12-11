// Mock database connection for tests
export const mockQuery = jest.fn();

jest.mock("../../db/connection", () => ({
  query: mockQuery,
  pool: {
    query: mockQuery,
  },
}));

