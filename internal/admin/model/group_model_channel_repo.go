package model

import "context"

type GroupModelChannelRepository struct {
	GetRandomSatisfiedChannel                func(group string, model string, ignoreFirstPriority bool) (*Channel, error)
	ListSatisfiedChannels                    func(group string, model string) ([]*Channel, error)
	AddGroupModelChannels                    func(channel *Channel) error
	DeleteGroupModelChannels                 func(channel *Channel) error
	UpdateGroupModelChannels                 func(channel *Channel) error
	RefreshGroupModelChannelsByChannelStatus func(channelId string, status bool) error
	GetTopChannelByModel                     func(group string, model string) (*Channel, error)
	GetGroupModels                           func(ctx context.Context, group string) ([]string, error)
}

var groupModelRouteRepo GroupModelChannelRepository

func BindGroupModelChannelRepository(repo GroupModelChannelRepository) {
	groupModelRouteRepo = repo
}

func mustGroupModelChannelRepo() GroupModelChannelRepository {
	if groupModelRouteRepo.GetRandomSatisfiedChannel == nil {
		panic("group model channel runtime repository not initialized")
	}
	if groupModelRouteRepo.ListSatisfiedChannels == nil {
		panic("group model channel runtime repository not initialized")
	}
	return groupModelRouteRepo
}
