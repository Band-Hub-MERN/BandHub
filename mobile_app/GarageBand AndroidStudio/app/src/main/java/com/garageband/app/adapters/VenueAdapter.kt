package com.garageband.app.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.garageband.app.R
import com.garageband.app.databinding.ItemVenueBinding
import com.garageband.app.models.Venue

class VenueAdapter(
    private val onVenueClick: (Venue) -> Unit,
    private val onFavoriteClick: (Venue) -> Unit
) : ListAdapter<Venue, VenueAdapter.VenueViewHolder>(VenueDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VenueViewHolder {
        val binding = ItemVenueBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return VenueViewHolder(binding)
    }

    override fun onBindViewHolder(holder: VenueViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class VenueViewHolder(
        private val binding: ItemVenueBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(venue: Venue) {
            binding.tvVenueName.text = venue.name
            binding.tvVenueDetails.text = "${venue.genre} • ${venue.priceRange} • ${venue.distanceMiles} miles away"
            binding.tvVenueDescription.text = venue.description
            binding.ratingBar.rating = venue.rating

            val favIcon = if (venue.isFavorite) R.drawable.ic_favorite_filled else R.drawable.ic_favorite_outline
            binding.ivFavorite.setImageResource(favIcon)

            binding.root.setOnClickListener { onVenueClick(venue) }
            binding.ivFavorite.setOnClickListener { onFavoriteClick(venue) }
        }
    }

    class VenueDiffCallback : DiffUtil.ItemCallback<Venue>() {
        override fun areItemsTheSame(oldItem: Venue, newItem: Venue) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Venue, newItem: Venue) = oldItem == newItem
    }
}
