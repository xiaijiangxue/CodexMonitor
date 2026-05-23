import { useCallback, type MouseEvent } from "react";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import { getCurrentWindow } from "@tauri-apps/api/window";
import i18n from "../../../locales/i18n";

import type { WorkspaceInfo } from "../../../types";
import { pushErrorToast } from "../../../services/toasts";
import { fileManagerName } from "../../../utils/platformPaths";

type SidebarMenuHandlers = {
  onDeleteThread: (workspaceId: string, threadId: string) => void;
  onSyncThread: (workspaceId: string, threadId: string) => void;
  onPinThread: (workspaceId: string, threadId: string) => void;
  onUnpinThread: (workspaceId: string, threadId: string) => void;
  isThreadPinned: (workspaceId: string, threadId: string) => boolean;
  onRenameThread: (workspaceId: string, threadId: string) => void;
  onReloadWorkspaceThreads: (workspaceId: string) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onDeleteWorktree: (workspaceId: string) => void;
};

export function useSidebarMenus({
  onDeleteThread,
  onSyncThread,
  onPinThread,
  onUnpinThread,
  isThreadPinned,
  onRenameThread,
  onReloadWorkspaceThreads,
  onDeleteWorkspace,
  onDeleteWorktree,
}: SidebarMenuHandlers) {
  const showThreadMenu = useCallback(
    async (
      event: MouseEvent,
      workspaceId: string,
      threadId: string,
      canPin: boolean,
    ) => {
      event.preventDefault();
      event.stopPropagation();
      const renameItem = await MenuItem.new({
        text: i18n.t("sidebar.rename", { ns: "layout" }),
        action: () => onRenameThread(workspaceId, threadId),
      });
      const syncItem = await MenuItem.new({
        text: i18n.t("sidebar.syncFromServer", { ns: "layout" }),
        action: () => onSyncThread(workspaceId, threadId),
      });
      const archiveItem = await MenuItem.new({
        text: i18n.t("sidebar.archive", { ns: "layout" }),
        action: () => onDeleteThread(workspaceId, threadId),
      });
      const copyItem = await MenuItem.new({
        text: i18n.t("sidebar.copyId", { ns: "layout" }),
        action: async () => {
          try {
            await navigator.clipboard.writeText(threadId);
          } catch {
            // Clipboard failures are non-fatal here.
          }
        },
      });
      const items = [renameItem, syncItem];
      if (canPin) {
        const isPinned = isThreadPinned(workspaceId, threadId);
        items.push(
          await MenuItem.new({
            text: isPinned ? i18n.t("sidebar.unpin", { ns: "layout" }) : i18n.t("sidebar.pin", { ns: "layout" }),
            action: () => {
              if (isPinned) {
                onUnpinThread(workspaceId, threadId);
              } else {
                onPinThread(workspaceId, threadId);
              }
            },
          }),
        );
      }
      items.push(copyItem, archiveItem);
      const menu = await Menu.new({ items });
      const window = getCurrentWindow();
      const position = new LogicalPosition(event.clientX, event.clientY);
      await menu.popup(position, window);
    },
    [
      isThreadPinned,
      onDeleteThread,
      onPinThread,
      onRenameThread,
      onSyncThread,
      onUnpinThread,
    ],
  );

  const showWorkspaceMenu = useCallback(
    async (event: MouseEvent, workspaceId: string) => {
      event.preventDefault();
      event.stopPropagation();
      const reloadItem = await MenuItem.new({
        text: i18n.t("sidebar.reloadThreads", { ns: "layout" }),
        action: () => onReloadWorkspaceThreads(workspaceId),
      });
      const deleteItem = await MenuItem.new({
        text: i18n.t("sidebar.delete", { ns: "layout" }),
        action: () => onDeleteWorkspace(workspaceId),
      });
      const menu = await Menu.new({ items: [reloadItem, deleteItem] });
      const window = getCurrentWindow();
      const position = new LogicalPosition(event.clientX, event.clientY);
      await menu.popup(position, window);
    },
    [onReloadWorkspaceThreads, onDeleteWorkspace],
  );

  const showWorktreeMenu = useCallback(
    async (event: MouseEvent, worktree: WorkspaceInfo) => {
      event.preventDefault();
      event.stopPropagation();
      const fileManagerLabel = fileManagerName();
      const reloadItem = await MenuItem.new({
        text: i18n.t("sidebar.reloadThreads", { ns: "layout" }),
        action: () => onReloadWorkspaceThreads(worktree.id),
      });
      const revealItem = await MenuItem.new({
        text: i18n.t("sidebar.showInFileManager", { ns: "layout", fileManager: fileManagerLabel }),
        action: async () => {
          if (!worktree.path) {
            return;
          }
          try {
            const { revealItemInDir } = await import(
              "@tauri-apps/plugin-opener"
            );
            await revealItemInDir(worktree.path);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            pushErrorToast({
              title: i18n.t("sidebar.couldNotShowInFileManager", { ns: "layout", fileManager: fileManagerLabel }),
              message,
            });
            console.warn("Failed to reveal worktree", {
              message,
              workspaceId: worktree.id,
              path: worktree.path,
            });
          }
        },
      });
      const deleteItem = await MenuItem.new({
        text: i18n.t("sidebar.deleteWorktree", { ns: "layout" }),
        action: () => onDeleteWorktree(worktree.id),
      });
      const menu = await Menu.new({ items: [reloadItem, revealItem, deleteItem] });
      const window = getCurrentWindow();
      const position = new LogicalPosition(event.clientX, event.clientY);
      await menu.popup(position, window);
    },
    [onReloadWorkspaceThreads, onDeleteWorktree],
  );

  const showCloneMenu = useCallback(
    async (event: MouseEvent, clone: WorkspaceInfo) => {
      event.preventDefault();
      event.stopPropagation();
      const fileManagerLabel = fileManagerName();
      const reloadItem = await MenuItem.new({
        text: i18n.t("sidebar.reloadThreads", { ns: "layout" }),
        action: () => onReloadWorkspaceThreads(clone.id),
      });
      const revealItem = await MenuItem.new({
        text: i18n.t("sidebar.showInFileManager", { ns: "layout", fileManager: fileManagerLabel }),
        action: async () => {
          if (!clone.path) {
            return;
          }
          try {
            const { revealItemInDir } = await import(
              "@tauri-apps/plugin-opener"
            );
            await revealItemInDir(clone.path);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            pushErrorToast({
              title: i18n.t("sidebar.couldNotShowCloneInFileManager", { ns: "layout", fileManager: fileManagerLabel }),
              message,
            });
            console.warn("Failed to reveal clone", {
              message,
              workspaceId: clone.id,
              path: clone.path,
            });
          }
        },
      });
      const deleteItem = await MenuItem.new({
        text: i18n.t("sidebar.deleteClone", { ns: "layout" }),
        action: () => onDeleteWorkspace(clone.id),
      });
      const menu = await Menu.new({ items: [reloadItem, revealItem, deleteItem] });
      const window = getCurrentWindow();
      const position = new LogicalPosition(event.clientX, event.clientY);
      await menu.popup(position, window);
    },
    [onReloadWorkspaceThreads, onDeleteWorkspace],
  );

  return { showThreadMenu, showWorkspaceMenu, showWorktreeMenu, showCloneMenu };
}
