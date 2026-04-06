package com.garageband.app.adapters

import androidx.fragment.app.Fragment
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.garageband.app.fragments.TicketListFragment

class TicketsPagerAdapter(fragment: Fragment) : FragmentStateAdapter(fragment) {

    override fun getItemCount() = 2

    override fun createFragment(position: Int): Fragment {
        return TicketListFragment.newInstance(isPast = position == 1)
    }
}
