from datetime import datetime
from typing import Sequence

from sentry.eventstore.models import Event
from sentry.models import Activity
from sentry.rules import EventState
from sentry.rules.conditions.base import EventCondition
from sentry.types.activity import ActivityType
from sentry.types.condition_activity import ConditionActivity, ConditionActivityType


class ReappearedEventCondition(EventCondition):
    id = "sentry.rules.conditions.reappeared_event.ReappearedEventCondition"
    label = "The issue changes state from ignored to unresolved"

    def passes(self, event: Event, state: EventState) -> bool:
        return state.has_reappeared

    def get_activity(
        self, start: datetime, end: datetime, limit: int
    ) -> Sequence[ConditionActivity]:
        # reappearances are recorded as SET_UNRESOLVED with no user
        activities = (
            Activity.objects.filter(
                datetime__gte=start,
                datetime__lt=end,
                type=ActivityType.SET_UNRESOLVED.value,
                user=None,
            )
            .order_by("-datetime")[:limit]
            .values_list("group", "datetime")
        )

        return [
            ConditionActivity(group_id=a[0], type=ConditionActivityType.REAPPEARED, timestamp=a[1])
            for a in activities
        ]
