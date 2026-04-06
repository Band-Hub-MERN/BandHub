package com.garageband.app.fragments

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.PopupMenu
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.garageband.app.R
import com.garageband.app.activities.ArtistDetailActivity
import com.garageband.app.adapters.ArtistAdapter
import com.garageband.app.adapters.CalendarAdapter
import com.garageband.app.databinding.FragmentHomeBinding
import com.garageband.app.models.Artist
import com.garageband.app.models.ShowDate
import com.garageband.app.models.ShowDateType
import com.garageband.app.utils.SampleData
import java.util.Calendar

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private lateinit var artistAdapter: ArtistAdapter

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupCalendar()
        setupFollowedBands()
        binding.tvShowAll.setOnClickListener {
            // TODO: Navigate to full artist list
        }
    }

    private fun setupCalendar() {
        val cal = Calendar.getInstance()
        val today = cal.get(Calendar.DAY_OF_MONTH)
        val month = cal.get(Calendar.MONTH)
        val year = cal.get(Calendar.YEAR)

        // Get day-of-week the 1st falls on (Sun=1 ... Sat=7), offset to 0-indexed
        cal.set(year, month, 1)
        val firstDayOfWeek = cal.get(Calendar.DAY_OF_WEEK) - 1  // 0=Sun
        val daysInMonth = cal.getActualMaximum(Calendar.DAY_OF_MONTH)

        // Build grid: padding nulls + day cells
        val days = mutableListOf<ShowDate?>()
        repeat(firstDayOfWeek) { days.add(null) }

        for (day in 1..daysInMonth) {
            val type = when (day) {
                in SampleData.upcomingShowDays -> ShowDateType.UPCOMING
                in SampleData.pastShowDays -> ShowDateType.PAST
                else -> ShowDateType.NONE
            }
            days.add(ShowDate(day, type))
        }

        // Pad to complete last row
        while (days.size % 7 != 0) days.add(null)

        val calendarAdapter = CalendarAdapter(
            days = days,
            today = today,
            onDayClick = { day -> onCalendarDayClick(day) }
        )

        binding.rvCalendar.apply {
            layoutManager = GridLayoutManager(requireContext(), 7)
            adapter = calendarAdapter
            isNestedScrollingEnabled = false
        }

        // Set month/year label
        val monthNames = arrayOf("January","February","March","April","May","June",
            "July","August","September","October","November","December")
        binding.tvMonthYear.text = "${monthNames[month]} $year"
    }

    private fun setupFollowedBands() {
        artistAdapter = ArtistAdapter(
            onArtistClick = { artist -> navigateToArtist(artist) },
            onMenuClick = { artist -> showArtistMenu(artist) }
        )

        binding.rvFollowedBands.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = artistAdapter
            isNestedScrollingEnabled = false
        }

        val followed = SampleData.artists.filter { it.isFollowed }
        artistAdapter.submitList(followed)
    }

    private fun navigateToArtist(artist: Artist) {
        val intent = Intent(requireContext(), ArtistDetailActivity::class.java).apply {
            putExtra(ArtistDetailActivity.EXTRA_ARTIST, artist)
        }
        startActivity(intent)
    }

    private fun showArtistMenu(artist: Artist) {
        // TODO: Show follow/unfollow popup
    }

    private fun onCalendarDayClick(day: Int) {
        // TODO: Show shows for selected day
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
