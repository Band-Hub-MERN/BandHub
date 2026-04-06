package com.garageband.app.activities

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.bumptech.glide.Glide
import com.garageband.app.R
import com.garageband.app.adapters.VenueAdapter
import com.garageband.app.databinding.ActivityArtistDetailBinding
import com.garageband.app.models.Artist
import com.garageband.app.models.Venue
import com.garageband.app.utils.SampleData

class ArtistDetailActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_ARTIST = "extra_artist"
    }

    private lateinit var binding: ActivityArtistDetailBinding
    private lateinit var venueAdapter: VenueAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityArtistDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val artist = intent.getSerializableExtra(EXTRA_ARTIST) as? Artist
        if (artist == null) {
            finish()
            return
        }

        setupToolbar(artist)
        setupHeroSection(artist)
        setupVenueList()
        setupButtons(artist)
    }

    private fun setupToolbar(artist: Artist) {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = ""
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }
    }

    private fun setupHeroSection(artist: Artist) {
        binding.tvArtistName.text = artist.name
        binding.tvArtistSubtitle.text = artist.genre

        Glide.with(this)
            .load(artist.imageUrl)
            .placeholder(R.drawable.ic_artist_placeholder)
            .centerCrop()
            .into(binding.ivArtistHero)
    }

    private fun setupVenueList() {
        venueAdapter = VenueAdapter(
            onVenueClick = { venue -> onVenueClick(venue) },
            onFavoriteClick = { venue -> onFavoriteClick(venue) }
        )

        binding.rvVenues.apply {
            layoutManager = LinearLayoutManager(this@ArtistDetailActivity)
            adapter = venueAdapter
            isNestedScrollingEnabled = false
        }

        venueAdapter.submitList(SampleData.venues)

        binding.tvVenueCount.text = "Within 50 miles • $-$$$"

        binding.btnViewMore.setOnClickListener {
            Toast.makeText(this, "Loading more shows…", Toast.LENGTH_SHORT).show()
            // TODO: Load paginated venue/show results from API
        }
    }

    private fun setupButtons(artist: Artist) {
        binding.btnAddItinerary.setOnClickListener {
            Toast.makeText(this, "Added to itinerary!", Toast.LENGTH_SHORT).show()
            // TODO: POST to backend – add artist to user itinerary
        }

        binding.btnDistance.setOnClickListener {
            Toast.makeText(this, "Showing nearby shows…", Toast.LENGTH_SHORT).show()
            // TODO: Use location service to sort venues by distance
        }
    }

    private fun onVenueClick(venue: Venue) {
        Toast.makeText(this, "Opening ${venue.name}…", Toast.LENGTH_SHORT).show()
        // TODO: Navigate to VenueDetailActivity
    }

    private fun onFavoriteClick(venue: Venue) {
        Toast.makeText(this, if (venue.isFavorite) "Removed from favorites" else "Added to favorites", Toast.LENGTH_SHORT).show()
        // TODO: POST to backend – toggle favorite
    }
}
