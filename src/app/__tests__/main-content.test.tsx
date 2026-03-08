import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MainContent } from "../main-content";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock actions
vi.mock("@/actions", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

// Mock contexts to just render children
vi.mock("@/lib/contexts/file-system-context", () => ({
  FileSystemProvider: ({ children }: any) => <>{children}</>,
  useFileSystem: vi.fn().mockReturnValue({
    getAllFiles: vi.fn().mockReturnValue(new Map()),
    refreshTrigger: 0,
    selectedFile: null,
    getFileContent: vi.fn(),
    updateFile: vi.fn(),
    files: new Map(),
  }),
}));

vi.mock("@/lib/contexts/chat-context", () => ({
  ChatProvider: ({ children }: any) => <>{children}</>,
  useChat: vi.fn().mockReturnValue({
    messages: [],
    input: "",
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
    status: "idle",
  }),
}));

// Mock complex child components with simple identifiable divs
vi.mock("@/components/chat/ChatInterface", () => ({
  ChatInterface: () => <div data-testid="chat-interface">Chat</div>,
}));

vi.mock("@/components/preview/PreviewFrame", () => ({
  PreviewFrame: () => <div data-testid="preview-frame">Preview Content</div>,
}));

vi.mock("@/components/editor/FileTree", () => ({
  FileTree: () => <div data-testid="file-tree">File Tree</div>,
}));

vi.mock("@/components/editor/CodeEditor", () => ({
  CodeEditor: () => <div data-testid="code-editor">Code Editor</div>,
}));

vi.mock("@/components/HeaderActions", () => ({
  HeaderActions: () => <div data-testid="header-actions">Header Actions</div>,
}));

// Mock resizable panels to simply render children
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children }: any) => <div>{children}</div>,
  ResizablePanel: ({ children }: any) => <div>{children}</div>,
  ResizableHandle: () => <div />,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

const mockUser = { id: "user-1", email: "test@test.com" };
const mockProject = {
  id: "project-1",
  name: "Test Project",
  messages: [],
  data: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

test("renders with Preview tab active by default", () => {
  render(<MainContent user={mockUser} project={mockProject} />);

  const previewTrigger = screen.getByRole("tab", { name: "Preview" });
  const codeTrigger = screen.getByRole("tab", { name: "Code" });

  expect(previewTrigger).toBeDefined();
  expect(codeTrigger).toBeDefined();
  expect(previewTrigger.getAttribute("data-state")).toBe("active");
  expect(codeTrigger.getAttribute("data-state")).toBe("inactive");
});

test("shows PreviewFrame when Preview tab is active", () => {
  render(<MainContent user={mockUser} project={mockProject} />);

  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
  expect(screen.queryByTestId("file-tree")).toBeNull();
});

test("switches to Code view when Code tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent user={mockUser} project={mockProject} />);

  const codeTrigger = screen.getByRole("tab", { name: "Code" });
  await user.click(codeTrigger);

  expect(codeTrigger.getAttribute("data-state")).toBe("active");
  expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("data-state")).toBe("inactive");
  expect(screen.getByTestId("code-editor")).toBeDefined();
  expect(screen.getByTestId("file-tree")).toBeDefined();
  expect(screen.queryByTestId("preview-frame")).toBeNull();
});

test("switches back to Preview view when Preview tab is clicked", async () => {
  const user = userEvent.setup();
  render(<MainContent user={mockUser} project={mockProject} />);

  // Switch to Code
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.queryByTestId("preview-frame")).toBeNull();

  // Switch back to Preview
  await user.click(screen.getByRole("tab", { name: "Preview" }));

  expect(screen.getByRole("tab", { name: "Preview" }).getAttribute("data-state")).toBe("active");
  expect(screen.getByRole("tab", { name: "Code" }).getAttribute("data-state")).toBe("inactive");
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();
});

test("can toggle between tabs multiple times", async () => {
  const user = userEvent.setup();
  render(<MainContent user={mockUser} project={mockProject} />);

  // Start: Preview active
  expect(screen.getByTestId("preview-frame")).toBeDefined();

  // Click Code
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();

  // Click Preview
  await user.click(screen.getByRole("tab", { name: "Preview" }));
  expect(screen.getByTestId("preview-frame")).toBeDefined();
  expect(screen.queryByTestId("code-editor")).toBeNull();

  // Click Code again
  await user.click(screen.getByRole("tab", { name: "Code" }));
  expect(screen.queryByTestId("preview-frame")).toBeNull();
  expect(screen.getByTestId("code-editor")).toBeDefined();
});
