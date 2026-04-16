import { useEffect, useState } from "react";
import {
  Users,
  Crown,
  Shield,
  UserMinus,
  Mail,
  Plus,
  Check,
  X,
  Edit3,
  ChevronDown,
  MoreHorizontal,
  ChevronRight,
  ArrowLeft,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIES,
  OrgMember,
  Organization,
} from "../data/mockData";
import { useApp } from "../context/AppContext";
import {
  createOrganization,
  deleteOrganization,
  getOrganizations,
  inviteToOrganization,
  leaveOrganization,
  removeOrganizationMember,
  updateOrganization,
  updateOrganizationMemberRole,
} from "../api/organization";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { getApiErrorMessage } from "../api/error-handling";

const ROLE_CONFIG = {
  owner: { label: "Owner", color: "#FFC904", bg: "rgba(255,201,4,0.10)", icon: Crown },
  admin: { label: "Admin", color: "#A855F7", bg: "rgba(168,85,247,0.10)", icon: Shield },
  member: { label: "Member", color: "#8A8A9A", bg: "rgba(138,138,154,0.10)", icon: Users },
};

function Avatar({
  initials,
  color,
  size = "md",
}: {
  initials: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = { sm: "w-7 h-7 text-xs", md: "w-9 h-9 text-sm", lg: "w-14 h-14 text-xl" };
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{
        background: color ? `${color}20` : "#1C1C1F",
        color: color || "#8A8A9A",
        border: `1px solid ${color ? `${color}30` : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {initials}
    </div>
  );
}

// ── Org list card ────────────────────────────────────────────────────────────
function OrgCard({
  org,
  myRole,
  onClick,
  onLeave,
}: {
  org: Organization;
  myRole: OrgMember["role"] | null;
  onClick: () => void;
  onLeave: () => void;
}) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const isOwner = myRole === "owner";

  const handleLeaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmLeave(true);
  };

  const handleConfirmLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLeave();
  };

  const handleCancelLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmLeave(false);
  };

  return (
    <div className="w-full bg-[#111113] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.10] transition-all group">
      {/* Confirm leave banner */}
      {confirmLeave && (
        <div className="mb-4 flex items-center gap-3 bg-[#EF4444]/[0.07] border border-[#EF4444]/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
          <p className="text-[#FAFAFA] text-xs flex-1">
            Leave <span className="font-semibold">{org.name}</span>? You'll lose access unless re-invited.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleCancelLeave}
              className="text-[#8A8A9A] hover:text-[#FAFAFA] text-xs font-semibold transition-colors px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLeave}
              className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
            >
              Leave
            </button>
          </div>
        </div>
      )}

      {/* Card body — div acting as clickable row */}
      <div
        onClick={onClick}
        className="flex items-center gap-4 cursor-pointer"
      >
        {/* Initials box */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg flex-shrink-0"
          style={{ background: `${org.color}15`, color: org.color, border: `1px solid ${org.color}25` }}
        >
          {org.initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[#FAFAFA] font-bold" style={{ fontSize: "1rem" }}>
              {org.name}
            </h3>
            <Edit3 className="w-3.5 h-3.5 text-[#8A8A9A] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: `${org.color}15`, color: org.color }}
            >
              {org.category}
            </span>
            <span className="text-[#8A8A9A] text-xs">{org.memberCount} members</span>
            {myRole && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: ROLE_CONFIG[myRole].bg,
                  color: ROLE_CONFIG[myRole].color,
                }}
              >
                {ROLE_CONFIG[myRole].label}
              </span>
            )}
          </div>
          <p className="text-[#8A8A9A] text-sm leading-relaxed truncate">{org.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {!isOwner && !confirmLeave && (
            <button
              onClick={handleLeaveClick}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-[#8A8A9A] hover:text-[#EF4444] text-xs font-semibold transition-all px-2.5 py-1.5 rounded-lg hover:bg-[#EF4444]/10"
              title="Leave organization"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave
            </button>
          )}
          <ChevronRight className="w-5 h-5 text-[#2A2A2F] group-hover:text-[#8A8A9A] transition-colors" />
        </div>
      </div>
    </div>
  );
}

// ── Single org management view ───────────────────────────────────────────────
function OrgManagementView({
  org,
  myRole,
  onBack,
  onLeave,
  onInvite,
  onRoleChange,
  onRemoveMember,
  onSaveOrganization,
  onDeleteOrganization,
}: {
  org: Organization;
  myRole: OrgMember["role"] | null;
  onBack?: () => void;
  onLeave?: () => Promise<void> | void;
  onInvite: (email: string, role: "admin" | "member") => Promise<void>;
  onRoleChange: (memberId: string, role: "admin" | "member") => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onSaveOrganization: (payload: { name: string; category: string; description: string }) => Promise<void>;
  onDeleteOrganization: () => Promise<void>;
}) {
  const { user } = useApp();
  const [members, setMembers] = useState<OrgMember[]>(org.members);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteSent, setInviteSent] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "settings">("members");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [orgName, setOrgName] = useState(org.name);
  const [orgCategory, setOrgCategory] = useState(org.category);
  const [orgDescription, setOrgDescription] = useState(org.description);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    setMembers(org.members);
    setOrgName(org.name);
    setOrgCategory(org.category);
    setOrgDescription(org.description);
  }, [org]);

  const myMemberId = user?.id;
  const isOwner = myRole === "owner";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      await onInvite(inviteEmail, inviteRole);
      setInviteSent(true);
      toast.success(`Invite sent to ${inviteEmail}`, { description: `Role: ${inviteRole}` });
      setInviteEmail("");
      setTimeout(() => setInviteSent(false), 3000);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to send invite"));
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await onRemoveMember(memberId);
      setMembers((m) => m.filter((x) => x.id !== memberId));
      toast("Member removed", { description: "They can no longer access this organization" });
      setOpenMenuId(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to remove member"));
    }
  };

  const handleRoleChange = async (memberId: string, role: OrgMember["role"]) => {
    if (role === 'owner') {
      return;
    }

    try {
      await onRoleChange(memberId, role);
      setMembers((m) => m.map((x) => (x.id === memberId ? { ...x, role } : x)));
      toast.success("Role updated");
      setOpenMenuId(null);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Unable to update role"));
    }
  };

  const handleLeave = async () => {
    await onLeave?.();
  };

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-7">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[#8A8A9A] hover:text-[#FAFAFA] text-xs font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Organizations
          </button>
        )}
        <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-1">Your Team</p>
        <h1
          className="text-[#FAFAFA] uppercase mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.25rem", fontWeight: 900, letterSpacing: "0.02em", lineHeight: 1 }}
        >
          Organizations
        </h1>
        <div className="w-10 h-0.5 bg-[#FFC904] mt-2 mb-3" />
        <p className="text-[#8A8A9A] text-sm">Manage your organization, members, and permissions</p>
      </div>

      {/* Org Profile Card */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-black flex-shrink-0 text-xl"
            style={{ background: `${org.color}15`, color: org.color, border: `1px solid ${org.color}25` }}
          >
            {org.initials}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="bg-[#1C1C1F] border border-[#FFC904]/40 text-[#FAFAFA] rounded-lg px-3 py-1.5 text-base font-bold outline-none flex-1"
                  autoFocus
                />
                <button onClick={() => setEditingName(false)} className="text-[#22C55E]">
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingName(false); setOrgName(org.name); }}
                  className="text-[#EF4444]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[#FAFAFA]" style={{ fontSize: "1.25rem", fontWeight: 700 }}>
                  {orgName}
                </h2>
                <button onClick={() => setEditingName(true)} className="text-[#8A8A9A] hover:text-[#FAFAFA] transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: `${org.color}15`, color: org.color }}
              >
                {orgCategory}
              </span>
              <span className="text-[#8A8A9A] text-xs">{members.length} members</span>
              {myRole && (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: ROLE_CONFIG[myRole].bg, color: ROLE_CONFIG[myRole].color }}
                >
                  {myRole === "owner" && <Crown className="w-3 h-3" />}
                  {myRole === "admin" && <Shield className="w-3 h-3" />}
                  {ROLE_CONFIG[myRole].label}
                </span>
              )}
            </div>
            <p className="text-[#8A8A9A] text-sm leading-relaxed">{org.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1C1C1F] p-1 rounded-xl mb-5 w-fit">
        {(["members", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? "bg-[#111113] text-[#FAFAFA] shadow-sm" : "text-[#8A8A9A] hover:text-[#FAFAFA]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "members" && (
        <div className="grid grid-cols-[1fr_320px] gap-5">
          {/* Member list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#FAFAFA] font-bold text-sm">Members ({members.length})</h3>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-visible">
              {members.map((member, i) => {
                const roleConf = ROLE_CONFIG[member.role];
                const RoleIcon = roleConf.icon;
                const isOwn = member.id === myMemberId;
                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-all relative ${
                      i < members.length - 1 ? "border-b border-white/[0.04]" : ""
                    }`}
                  >
                    <Avatar initials={member.avatar} color={member.role === "owner" ? "#FFC904" : undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[#FAFAFA] font-semibold text-sm">{member.name}</p>
                        {isOwn && (
                          <span className="text-[10px] bg-[#FFC904]/10 text-[#FFC904] px-1.5 py-0.5 rounded font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[#8A8A9A] text-xs mt-0.5">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: roleConf.bg, color: roleConf.color }}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {roleConf.label}
                      </span>
                      {!isOwn && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                            className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-[#8A8A9A] hover:text-[#FAFAFA] transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === member.id && (
                            <div className="absolute right-0 top-8 bg-[#1C1C1F] border border-white/[0.10] rounded-xl p-1.5 z-30 w-44 shadow-xl">
                              {member.role !== "admin" && (
                                <button
                                  onClick={() => handleRoleChange(member.id, "admin")}
                                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#8A8A9A] hover:text-[#FAFAFA] hover:bg-white/[0.06] transition-all"
                                >
                                  <Shield className="w-3.5 h-3.5" /> Make Admin
                                </button>
                              )}
                              {member.role !== "member" && (
                                <button
                                  onClick={() => handleRoleChange(member.id, "member")}
                                  className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#8A8A9A] hover:text-[#FAFAFA] hover:bg-white/[0.06] transition-all"
                                >
                                  <Users className="w-3.5 h-3.5" /> Set as Member
                                </button>
                              )}
                              <div className="my-1 border-t border-white/[0.06]" />
                              <button
                                onClick={() => handleRemove(member.id)}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                              >
                                <UserMinus className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invite panel */}
          <div>
            <h3 className="text-[#FAFAFA] font-bold text-sm mb-3">Invite Members</h3>
            <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5">
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 bg-[#1C1C1F] border border-white/[0.08] rounded-xl px-3.5 py-2.5 focus-within:border-[#FFC904]/40 transition-colors">
                    <Mail className="w-4 h-4 text-[#8A8A9A] flex-shrink-0" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="member@example.com"
                      className="bg-transparent text-[#FAFAFA] placeholder:text-[#8A8A9A] outline-none flex-1 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["member", "admin"] as const).map((role) => {
                      const conf = ROLE_CONFIG[role];
                      const RoleIcon = conf.icon;
                      return (
                        <button
                          type="button"
                          key={role}
                          onClick={() => setInviteRole(role)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            inviteRole === role
                              ? "border-[#FFC904]/30 bg-[#FFC904]/[0.05]"
                              : "border-white/[0.06] hover:border-white/[0.12]"
                          }`}
                        >
                          <RoleIcon
                            className="w-3.5 h-3.5 mb-1.5"
                            style={{ color: inviteRole === role ? conf.color : "#8A8A9A" }}
                          />
                          <p className={`text-xs font-semibold capitalize ${inviteRole === role ? "text-[#FAFAFA]" : "text-[#8A8A9A]"}`}>
                            {conf.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {inviteSent && (
                  <div className="flex items-center gap-2 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-xl px-3 py-2.5 text-xs">
                    <Check className="w-4 h-4" /> Invite sent successfully!
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] py-3 rounded-xl font-bold text-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Send Invite
                </button>
              </form>

              {/* Permission overview */}
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-3">
                  Permission Matrix
                </p>
                <div className="space-y-2">
                  {[
                    { action: "Book garages", member: true, admin: true, owner: true },
                    { action: "Post events", member: true, admin: true, owner: true },
                    { action: "Invite members", member: false, admin: true, owner: true },
                    { action: "Remove members", member: false, admin: true, owner: true },
                    { action: "Change roles", member: false, admin: false, owner: true },
                    { action: "Delete org", member: false, admin: false, owner: true },
                  ].map((row) => (
                    <div key={row.action} className="flex items-center gap-2 text-xs">
                      <span className="text-[#8A8A9A] flex-1">{row.action}</span>
                      {(["member", "admin", "owner"] as const).map((r) => (
                        <div
                          key={r}
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ background: row[r] ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}
                        >
                          {row[r] ? (
                            <Check className="w-3 h-3 text-[#22C55E]" />
                          ) : (
                            <X className="w-3 h-3 text-[#EF4444]/50" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-[10px] text-[#8A8A9A] mt-1">
                    <span className="flex-1" />
                    <span className="w-6 text-center">Mem</span>
                    <span className="w-6 text-center">Adm</span>
                    <span className="w-6 text-center">Own</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="max-w-xl space-y-5">
          <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-[#FAFAFA] font-bold mb-4">Organization Info</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Name</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Category</label>
                <div className="relative">
                  <select
                    value={orgCategory}
                    onChange={(e) => setOrgCategory(e.target.value)}
                    className="w-full appearance-none bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors pr-10"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#8A8A9A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[#8A8A9A] text-xs font-semibold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40 transition-colors resize-none placeholder:text-[#8A8A9A]"
                />
              </div>
              <button
                onClick={async () => {
                  try {
                    await onSaveOrganization({
                      name: orgName,
                      category: orgCategory,
                      description: orgDescription,
                    });
                    toast.success("Organization updated");
                  } catch (error: unknown) {
                    toast.error(getApiErrorMessage(error, "Unable to update organization"));
                  }
                }}
                className="bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-[#111113] border border-[#EF4444]/20 rounded-2xl p-6 space-y-5">
            <h3 className="text-[#EF4444] font-bold">Danger Zone</h3>

            {/* Leave org — non-owners only */}
            {!isOwner && onLeave && (
              <div className="pb-5 border-b border-white/[0.06]">
                <p className="text-[#FAFAFA] text-sm font-semibold mb-1">Leave Organization</p>
                <p className="text-[#8A8A9A] text-sm mb-4">
                  You'll be removed from <span className="text-[#FAFAFA]">{org.name}</span> and lose access to its bookings and events. You can only rejoin via a new invite.
                </p>
                {confirmLeave ? (
                  <div className="flex items-center gap-3 bg-[#EF4444]/[0.07] border border-[#EF4444]/20 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                    <p className="text-[#FAFAFA] text-xs flex-1">Are you sure? This cannot be undone.</p>
                    <button
                      onClick={() => setConfirmLeave(false)}
                      className="text-[#8A8A9A] hover:text-[#FAFAFA] text-xs font-semibold transition-colors px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLeave}
                      className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                    >
                      Confirm Leave
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmLeave(true)}
                    className="flex items-center gap-2 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Organization
                  </button>
                )}
              </div>
            )}

            {/* Owner can't leave without transferring */}
            {isOwner && (
              <div className="pb-5 border-b border-white/[0.06]">
                <p className="text-[#FAFAFA] text-sm font-semibold mb-1">Leave Organization</p>
                <p className="text-[#8A8A9A] text-sm">
                  As the owner, you must transfer ownership to another member before leaving.
                </p>
              </div>
            )}

            {/* Delete org — owners only */}
            <div>
              <p className="text-[#FAFAFA] text-sm font-semibold mb-1">Delete Organization</p>
              <p className="text-[#8A8A9A] text-sm mb-4">
                Permanently delete this organization. This cannot be undone.
              </p>
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                className="border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete organization"
        message={`Delete ${org.name}? This removes the organization, its events, bookings, and invites. This cannot be undone.`}
        confirmLabel="Delete organization"
        danger
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await onDeleteOrganization();
            setConfirmDeleteOpen(false);
          } catch (error: unknown) {
            toast.error(getApiErrorMessage(error, "Unable to delete organization"));
            setConfirmDeleteOpen(false);
          }
        }}
      />
    </div>
  );
}

// ── Root component ───────────────────────────────────────────────────────────
export default function OrganizationManagement() {
  const { user } = useApp();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCategory, setNewOrgCategory] = useState(CATEGORIES[0]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    void refreshOrganizations();
  }, []);

  const refreshOrganizations = async () => {
    setLoading(true);
    try {
      const orgRows = await getOrganizations();
      setOrganizations(orgRows);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to load organizations'));
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const userOrgs = organizations;

  // Derive the current user's role in a given org
  const getMyRole = (org: Organization): OrgMember["role"] | null => {
    const me = org.members.find((m) => m.id === user?.id);
    return me?.role ?? null;
  };

  const handleLeave = async (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    await leaveOrganization(orgId);
    await refreshOrganizations();
    setSelectedOrgId(null);
    toast.success(`You've left ${org?.name ?? "the organization"}`, {
      description: "You can rejoin only via a new invite.",
    });
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error('Organization name is required');
      return;
    }

    try {
      await createOrganization(newOrgName.trim(), newOrgCategory);
      setNewOrgName('');
      await refreshOrganizations();
      toast.success('Organization created');
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to create organization'));
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId);
    await deleteOrganization(orgId);
    await refreshOrganizations();
    setSelectedOrgId(null);
    toast.success(`${org?.name ?? 'Organization'} deleted`);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl text-[#8A8A9A] text-sm">
        Loading organizations...
      </div>
    );
  }

  // No orgs
  if (userOrgs.length === 0) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="mb-7">
          <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-1">Your Team</p>
          <h1
            className="text-[#FAFAFA] uppercase mb-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.25rem", fontWeight: 900, letterSpacing: "0.02em", lineHeight: 1 }}
          >
            Organizations
          </h1>
          <div className="w-10 h-0.5 bg-[#FFC904] mt-2 mb-3" />
        </div>
        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-10 text-center">
          <Users className="w-10 h-10 text-[#2A2A2F] mx-auto mb-3" />
          <p className="text-[#FAFAFA] font-semibold mb-1">You're not in any organization yet</p>
          <p className="text-[#8A8A9A] text-sm">Create a new org or accept a pending invite.</p>
          <div className="max-w-sm mx-auto mt-5 space-y-2">
            <input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Organization name"
              className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40"
            />
            <select
              value={newOrgCategory}
              onChange={(e) => setNewOrgCategory(e.target.value)}
              className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button
              onClick={() => void handleCreateOrganization()}
              className="w-full bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] py-3 rounded-xl font-bold text-sm transition-all"
            >
              Create Organization
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Drill into selected org
  if (selectedOrgId) {
    const org = organizations.find((o) => o.id === selectedOrgId);
    if (org) {
      const myRole = getMyRole(org);
      return (
        <OrgManagementView
          org={org}
          myRole={myRole}
          onBack={() => setSelectedOrgId(null)}
          onLeave={myRole !== "owner" ? async () => handleLeave(org.id) : undefined}
          onDeleteOrganization={async () => handleDeleteOrganization(org.id)}
          onInvite={(email, role) => inviteToOrganization(org.id, email, role)}
          onRoleChange={(memberId, role) => updateOrganizationMemberRole(org.id, memberId, role).then(refreshOrganizations)}
          onRemoveMember={(memberId) => removeOrganizationMember(org.id, memberId).then(refreshOrganizations)}
          onSaveOrganization={(payload) => updateOrganization(org.id, payload).then(refreshOrganizations)}
        />
      );
    }
  }

  // Multi-org list
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-7">
        <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-1">Your Teams</p>
        <h1
          className="text-[#FAFAFA] uppercase mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.25rem", fontWeight: 900, letterSpacing: "0.02em", lineHeight: 1 }}
        >
          Organizations
        </h1>
        <div className="w-10 h-0.5 bg-[#FFC904] mt-2 mb-3" />
        <p className="text-[#8A8A9A] text-sm">
          You're a member of {userOrgs.length} organizations. Select one to manage it.
        </p>
      </div>

      <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-5 mb-5">
        <h3 className="text-[#FAFAFA] font-bold text-sm mb-3">Create Another Organization</h3>
        <div className="grid grid-cols-[1fr_180px_auto] gap-2">
          <input
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="Organization name"
            className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40"
          />
          <select
            value={newOrgCategory}
            onChange={(e) => setNewOrgCategory(e.target.value)}
            className="w-full bg-[#1C1C1F] border border-white/[0.08] text-[#FAFAFA] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FFC904]/40"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button
            onClick={() => void handleCreateOrganization()}
            className="bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-4 py-3 rounded-xl font-bold text-sm transition-all"
          >
            Create
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {userOrgs.map((org) => (
          <OrgCard
            key={org.id}
            org={org}
            myRole={getMyRole(org)}
            onClick={() => setSelectedOrgId(org.id)}
            onLeave={() => handleLeave(org.id)}
          />
        ))}
      </div>
    </div>
  );
}