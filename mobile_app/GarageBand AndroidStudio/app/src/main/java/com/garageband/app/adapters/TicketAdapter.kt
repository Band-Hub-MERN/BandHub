package com.garageband.app.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions
import com.garageband.app.R
import com.garageband.app.databinding.ItemTicketBinding
import com.garageband.app.models.Ticket
import java.text.SimpleDateFormat
import java.util.Locale

class TicketAdapter(
    private val onTicketClick: (Ticket) -> Unit
) : ListAdapter<Ticket, TicketAdapter.TicketViewHolder>(TicketDiffCallback()) {

    private val dateFormat = SimpleDateFormat("EEE, MMM d yyyy", Locale.getDefault())

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TicketViewHolder {
        val binding = ItemTicketBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return TicketViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TicketViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class TicketViewHolder(
        private val binding: ItemTicketBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(ticket: Ticket) {
            binding.tvArtistName.text = ticket.artistName
            binding.tvShowName.text = ticket.showName
            binding.tvShowDateTime.text = "${dateFormat.format(ticket.showDate)} • ${ticket.showTime}"
            binding.tvVenueName.text = ticket.venueName

            Glide.with(binding.root.context)
                .load(ticket.imageUrl)
                .placeholder(R.drawable.ic_artist_placeholder)
                .error(R.drawable.ic_artist_placeholder)
                .centerCrop()
                .transition(DrawableTransitionOptions.withCrossFade())
                .into(binding.ivTicketArtist)

            binding.root.setOnClickListener { onTicketClick(ticket) }
        }
    }

    class TicketDiffCallback : DiffUtil.ItemCallback<Ticket>() {
        override fun areItemsTheSame(oldItem: Ticket, newItem: Ticket) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Ticket, newItem: Ticket) = oldItem == newItem
    }
}
