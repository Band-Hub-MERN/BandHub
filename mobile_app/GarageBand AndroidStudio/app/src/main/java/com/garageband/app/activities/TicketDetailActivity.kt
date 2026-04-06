package com.garageband.app.activities

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.garageband.app.R
import com.garageband.app.databinding.ActivityTicketDetailBinding
import com.garageband.app.models.Ticket
import java.text.SimpleDateFormat
import java.util.Locale

class TicketDetailActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_TICKET = "extra_ticket"
    }

    private lateinit var binding: ActivityTicketDetailBinding
    private val dateFormat = SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTicketDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val ticket = intent.getSerializableExtra(EXTRA_TICKET) as? Ticket
        if (ticket == null) {
            finish()
            return
        }

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Ticket Details"
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        Glide.with(this)
            .load(ticket.imageUrl)
            .placeholder(R.drawable.ic_artist_placeholder)
            .centerCrop()
            .into(binding.ivArtistBanner)

        binding.tvArtistName.text = ticket.artistName
        binding.tvShowName.text = ticket.showName
        binding.tvVenue.text = ticket.venueName
        binding.tvDate.text = dateFormat.format(ticket.showDate)
        binding.tvTime.text = ticket.showTime
        binding.tvSeat.text = ticket.seatInfo
        binding.tvPrice.text = "$${String.format("%.2f", ticket.price)}"

        // TODO: Generate real QR code from ticket.qrCode using ZXing library
        binding.ivQrCode.setImageResource(R.drawable.ic_qr_placeholder)
    }
}
