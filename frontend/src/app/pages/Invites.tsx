import { useEffect, useState } from 'react';
import { Check, Mail, Clock, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { acceptIncomingInvite, declineIncomingInvite, getIncomingInvites } from '../api/organization';
import type { Invite } from '../data/mockData';
import { getApiErrorMessage } from '../api/error-handling';

export default function Invites() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refreshInvites();
  }, []);

  const refreshInvites = async () => {
    setLoading(true);
    try {
      const inviteRows = await getIncomingInvites();
      setInvites(inviteRows);
    } catch {
      toast.error('Unable to load your invites right now.');
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  const accept = async (inviteId: string) => {
    try {
      await acceptIncomingInvite(inviteId);
      toast.success('Invite accepted.');
      await refreshInvites();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to accept invite.'));
    }
  };

  const decline = async (inviteId: string) => {
    try {
      await declineIncomingInvite(inviteId);
      toast.success('Invite declined.');
      await refreshInvites();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to decline invite.'));
    }
  };

  const pendingInviteCount = invites.length;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-7">
        <p className="text-[#8A8A9A] text-xs font-semibold uppercase tracking-widest mb-1">Your Inbox</p>
        <h1
          className="text-[#FAFAFA] uppercase mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '2.25rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1 }}
        >
          Organization Invites
        </h1>
        <div className="w-10 h-0.5 bg-[#FFC904] mt-2 mb-3" />
        <p className="text-[#8A8A9A] text-sm">{pendingInviteCount} pending invite{pendingInviteCount !== 1 ? 's' : ''}</p>
      </div>

      {loading && (
        <div className="text-[#8A8A9A] text-sm mb-4">Loading invite activity...</div>
      )}

      {invites.length === 0 ? (
        <div className="text-center py-20 bg-[#111113] border border-white/[0.06] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1C1F] flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-[#2A2A2F]" />
          </div>
          <h3 className="text-[#FAFAFA] font-bold mb-2">No pending invites</h3>
          <p className="text-[#8A8A9A] text-sm">Invite history and pending joins will appear here once your organization sends invites.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.map(inv => (
            <div key={inv.id} className="bg-[#111113] border border-white/[0.08] rounded-2xl p-5 hover:border-white/[0.12] transition-all">
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0"
                  style={{ background: `${inv.orgColor}15`, color: inv.orgColor, border: `1px solid ${inv.orgColor}25` }}
                >
                  {inv.orgName.split(' ').map((word) => word[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#FAFAFA] font-bold mb-1">{inv.orgName}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 text-[#8A8A9A] text-xs">
                      <Users className="w-3.5 h-3.5" />
                      <span>Role: <span className="text-[#FAFAFA] font-medium">{inv.role}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#8A8A9A] text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        Sent by <span className="text-[#FAFAFA] font-medium">{inv.sentBy}</span>
                        {' '}· {new Date(inv.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => void accept(inv.id)}
                      className="flex items-center gap-2 bg-[#FFC904] hover:bg-[#FFD84D] text-[#09090B] px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => void decline(inv.id)}
                      className="flex items-center gap-2 border border-white/[0.08] text-[#8A8A9A] hover:text-[#EF4444] hover:border-[#EF4444]/30 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}