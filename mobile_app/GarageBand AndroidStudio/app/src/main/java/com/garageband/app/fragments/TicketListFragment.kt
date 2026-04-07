package com.garageband.app.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import com.garageband.app.activities.TicketDetailActivity
import com.garageband.app.adapters.TicketAdapter
import com.garageband.app.databinding.FragmentTicketListBinding
import com.garageband.app.models.Ticket
import com.garageband.app.utils.SampleData

class TicketListFragment : Fragment() {

    private var _binding: FragmentTicketListBinding? = null
    private val binding get() = _binding!!

    private var isPast = false

    companion object {
        private const val ARG_IS_PAST = "is_past"

        fun newInstance(isPast: Boolean): TicketListFragment {
            return TicketListFragment().apply {
                arguments = Bundle().apply {
                    putBoolean(ARG_IS_PAST, isPast)
                }
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        isPast = arguments?.getBoolean(ARG_IS_PAST) ?: false
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTicketListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val ticketAdapter = TicketAdapter { ticket -> openTicketDetail(ticket) }

        binding.rvTickets.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = ticketAdapter
        }

        val tickets = if (isPast) SampleData.getPastTickets() else SampleData.getUpcomingTickets()

        if (tickets.isEmpty()) {
            binding.tvEmpty.visibility = View.VISIBLE
            binding.rvTickets.visibility = View.GONE
        } else {
            binding.tvEmpty.visibility = View.GONE
            binding.rvTickets.visibility = View.VISIBLE
            ticketAdapter.submitList(tickets)
        }
    }

    private fun openTicketDetail(ticket: Ticket) {
        val intent = Intent(requireContext(), TicketDetailActivity::class.java).apply {
            putExtra(TicketDetailActivity.EXTRA_TICKET, ticket)
        }
        startActivity(intent)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
