package group

import "github.com/yeying-community/router/internal/admin/model"

func ListCatalog() ([]model.GroupCatalog, error) {
	return model.ListGroupCatalog()
}

func Get(name string) (model.GroupCatalog, error) {
	return model.GetGroupCatalogByName(name)
}

func Create(item model.GroupCatalog) (model.GroupCatalog, error) {
	return model.CreateGroupCatalog(item)
}

func Update(item model.GroupCatalog) (model.GroupCatalog, error) {
	return model.UpdateGroupCatalog(item)
}

func Delete(name string) error {
	return model.DeleteGroupCatalog(name)
}

func ListChannelBindings(name string) ([]model.GroupChannelBindingItem, error) {
	return model.ListGroupChannelBindings(name)
}

func ReplaceChannelBindings(name string, channelIDs []string) error {
	return model.ReplaceGroupChannelBindings(name, channelIDs)
}
