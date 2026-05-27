import { Loader2, Trash2, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function TeamSettings() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const data = await api.get("/team");
      setMembers(data);
    } catch (err) {
      console.error("Failed to load team", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post("/team/invite", { email: inviteEmail });
      alert(`Invitation sent to ${inviteEmail}`);
      setShowInvite(false);
      setInviteEmail("");
      // Real app: Re-fetch or add to a pending invites list
    } catch (err) {
      alert("Failed to send invite. Check your permissions.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this member from the organization?")) return;
    try {
      await api.delete(`/team/${id}`);
      fetchTeam();
    } catch (err) {
      alert("Failed to remove member");
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Team Management</h3>
            <p className="text-sm text-slate-500 mt-1">Manage who has access to your workspace and their roles.</p>
          </div>
          <button 
            onClick={() => setShowInvite(!showInvite)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-md shadow-indigo-100 flex items-center gap-2"
          >
            {showInvite ? "Cancel" : <><UserPlus size={14} /> Invite Member</>}
          </button>
        </div>

        {showInvite && (
          <form onSubmit={handleInvite} className="mb-8 p-6 rounded-2xl bg-indigo-50 border border-indigo-100 animate-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 shadow-sm"
                  autoFocus
                  required
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  disabled={inviting}
                  className="w-full md:w-auto h-[46px] rounded-xl bg-indigo-600 px-8 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : "Send Invite"}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-4">
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-6">User ID</div>
              <div className="col-span-4">Role</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {members.map((member) => (
              <div key={member.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Users size={14} />
                  </div>
                  <span className="text-sm font-medium text-slate-900">{member.uid}</span>
                </div>
                <div className="col-span-4">
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    {member.role}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <button 
                    onClick={() => handleRemove(member.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove Member"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                You are the only member in this workspace.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
